const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");
const router = express.Router();
const { validateFocus, validateAnalysisPayload } = require("../utils/validate");
const asyncHandler = require("../middleware/asyncHandler");
const { assertEnv } = require("../config/env");

const env = assertEnv();

const analysisCache = new Map();
const CACHE_MAX_ENTRIES = 100;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Generous timeout for AI generation — must be less than server/nginx timeout
const AI_CALL_TIMEOUT_MS = 85000; // 85 seconds
const RETRY_DELAYS_MS = [0, 3000]; // first attempt immediate, retry after 3s

function hashInput(files, focus) {
  const hash = crypto.createHash("sha256");
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
  for (const file of sortedFiles) {
    hash.update(file.path);
    hash.update(file.content || "");
  }
  hash.update(focus);
  return hash.digest("hex");
}

const FOCUS_PROMPTS = {
  fullstack: "Review as a full-stack engineer covering frontend, backend, and DevOps holistically.",
  frontend: "Review primarily as a frontend engineer — focus on UI patterns, React/component architecture, accessibility, and client performance.",
  backend: "Review primarily as a backend engineer — focus on API design, data flow, error handling, security, and scalability.",
  security: "Review primarily as a security engineer — focus on vulnerabilities, auth, input validation, secrets, and OWASP risks.",
  devops: "Review primarily as a DevOps engineer — focus on deployment, CI/CD, configuration, monitoring, and infrastructure.",
};

function buildPrompt(files, repoName, focus = "fullstack") {
  // Limit each file to 1500 chars and total files to 12 for fast AI response
  const MAX_FILES_IN_PROMPT = 12;
  const MAX_CHARS_PER_FILE = 1500;

  const selectedFiles = files.slice(0, MAX_FILES_IN_PROMPT);
  const fileSnippets = selectedFiles
    .map((f) => `### File: ${f.path}\n\`\`\`\n${String(f.content || "").slice(0, MAX_CHARS_PER_FILE)}\n\`\`\``)
    .join("\n\n");

  const focusInstruction = FOCUS_PROMPTS[focus] || FOCUS_PROMPTS.fullstack;

  return `You are a senior software engineer reviewing the GitHub repository "${repoName}".

${focusInstruction}

Analyze these ${selectedFiles.length} code files:

${fileSnippets}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact shape:

{
  "scores": {
    "cleanCode": <0-100 integer>,
    "performance": <0-100 integer>,
    "security": <0-100 integer>,
    "scalability": <0-100 integer>,
    "documentation": <0-100 integer>
  },
  "overallScore": <0-100 integer, weighted average>,
  "level": "<Beginner | Intermediate | Advanced | Expert>",
  "summary": "<2-3 sentence executive summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": [
    {
      "title": "<short title>",
      "description": "<what the issue is and why it matters>",
      "file": "<file path>",
      "before": "<actual code snippet, max 4 lines>",
      "after": "<improved code snippet, max 4 lines>",
      "impact": "<Low | Medium | High>"
    }
  ],
  "fileBreakdown": [
    {
      "file": "<file path>",
      "score": <0-100 integer>,
      "topIssue": "<main issue in this file>",
      "dimensions": { "cleanCode": <0-100>, "security": <0-100> }
    }
  ],
  "skillGaps": [
    {
      "skill": "<skill name>",
      "currentLevel": "<Beginner | Intermediate | Advanced>",
      "recommendation": "<actionable recommendation>"
    }
  ],
  "techStack": ["<technology 1>", "<technology 2>"],
  "fixItPrompt": "<A concise prompt for Cursor/Copilot to fix the top 3 issues. 2-3 sentences.>"
}

Rules: exactly 3 improvements, exactly 3 skillGaps, fileBreakdown for up to 6 files. Be specific. Most repos score 30-75.`;
}

function parseJsonResponse(rawText) {
  if (!rawText) throw new Error("Empty AI response");

  // Step 1: Strip thinking tags (gemini-2.5-flash includes <think>...</think>)
  let cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .trim();

  // Step 2: Strip markdown code fences
  cleaned = cleaned
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Step 3: Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch { /* continue */ }

  // Step 4: Extract first complete JSON object (handles surrounding prose)
  const start = cleaned.indexOf("{");
  if (start >= 0) {
    // Find the matching closing brace
    let depth = 0;
    let end = -1;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end > start) {
      const slice = cleaned.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch { /* continue */ }

      // Step 5: Try fixing common AI JSON mistakes
      const fixed = slice
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/([\u0000-\u001F\u007F])/g, " ") // strip control chars
        .replace(/\/\/.*/g, "");                    // strip JS comments
      try {
        return JSON.parse(fixed);
      } catch { /* continue */ }
    }
  }

  throw new Error("Could not extract valid JSON from AI response");
}

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't resolve
 * within timeoutMs milliseconds.
 */
function withTimeout(promise, timeoutMs, label = "operation") {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

router.post("/", asyncHandler(async (req, res) => {
  const { files, repoName, focus: rawFocus } = req.body;

  const payloadCheck = validateAnalysisPayload(files);
  if (!payloadCheck.valid) {
    return res.status(400).json({ error: payloadCheck.error });
  }

  const focus = validateFocus(rawFocus);
  if (!focus) {
    return res.status(400).json({ error: "Invalid analysis focus mode" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI analysis is not configured on this server" });
  }

  const safeRepoName = String(repoName || "repository").slice(0, 200);

  // Serve from in-memory cache to avoid redundant API calls and score drift
  const inputHash = hashInput(payloadCheck.files, focus);
  const cachedResult = analysisCache.get(inputHash);
  if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_TTL_MS)) {
    console.log(`[analyze] Cache hit for ${safeRepoName} (${focus})`);
    return res.json(cachedResult.data);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const prompt = buildPrompt(payloadCheck.files, safeRepoName, focus);
  console.log(`[analyze] Prompt chars: ${prompt.length} | Repo: ${safeRepoName} | Focus: ${focus}`);

  // Model priority: fast → reliable → ultrafast fallback.
  // All models verified available via ListModels API for this key.
  const modelsToTry = [
    env.geminiModel || "gemini-2.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  let lastError = null;

  for (const modelName of modelsToTry) {
    console.log(`[analyze] Trying model: ${modelName}`);
    let model;
    try {
      // Do NOT use responseMimeType — it breaks gemini-2.5-flash (thinking model)
      // whose thinking tokens interfere with strict JSON mode.
      // We parse JSON ourselves from the text response.
      model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192, // Must be large enough for full JSON analysis response
        },
      });
    } catch (err) {
      lastError = err;
      console.warn(`[analyze] Failed to initialize model ${modelName}: ${err.message}`);
      continue;
    }

    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
      if (attempt > 0) {
        await delay(RETRY_DELAYS_MS[attempt]);
      }
      try {
        console.log(`[analyze] ${modelName} attempt ${attempt + 1}/${RETRY_DELAYS_MS.length}`);

        // Wrap the AI call with a hard timeout to prevent hanging
        const result = await withTimeout(
          model.generateContent(prompt),
          AI_CALL_TIMEOUT_MS,
          `Gemini ${modelName}`
        );

        const rawText = result.response.text();
        if (!rawText || rawText.trim().length < 50) {
          throw new Error("Empty or too-short AI response");
        }

        const analysis = parseJsonResponse(rawText);

        // Validate required fields
        if (!analysis.scores || typeof analysis.overallScore !== "number") {
          throw new Error("AI response missing required fields (scores/overallScore)");
        }

        // Ensure optional arrays exist
        if (!Array.isArray(analysis.improvements)) analysis.improvements = [];
        if (!Array.isArray(analysis.fileBreakdown)) analysis.fileBreakdown = [];
        if (!Array.isArray(analysis.skillGaps)) analysis.skillGaps = [];
        if (!Array.isArray(analysis.strengths)) analysis.strengths = [];
        if (!analysis.fixItPrompt) {
          analysis.fixItPrompt = `Fix the top issues in ${safeRepoName}: ${analysis.improvements.slice(0, 3).map((i) => i.title).join(", ")}.`;
        }

        const responseData = { analysis, repoName: safeRepoName, focus };

        // Store in cache (evict oldest entry if full)
        if (analysisCache.size >= CACHE_MAX_ENTRIES) {
          const oldestKey = analysisCache.keys().next().value;
          analysisCache.delete(oldestKey);
        }
        analysisCache.set(inputHash, { data: responseData, timestamp: Date.now() });

        console.log(`[analyze] Success: ${modelName} | score=${analysis.overallScore}`);
        return res.json(responseData);

      } catch (err) {
        lastError = err;
        const msg = err.message || "";
        console.warn(`[analyze] ${modelName} attempt ${attempt + 1} failed: ${msg}`);

        // On timeout or rate limit, skip retries for this model and try the next one
        const shouldSkipRetry =
          msg.includes("timed out") ||
          msg.includes("503") ||
          msg.includes("429") ||
          msg.includes("quota") ||
          msg.includes("rate") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("Service Unavailable");

        if (shouldSkipRetry) {
          console.warn(`[analyze] Skipping retries for ${modelName} due to: ${msg}`);
          break;
        }
      }
    }
  }

  console.error("[analyze] All models failed. Last error:", lastError?.message);

  const errorMsg = lastError?.message || "AI analysis failed";
  const isTimeout = errorMsg.includes("timed out");
  const is429 = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED");

  const friendlyMsg = isTimeout
    ? "Analysis timed out — the repository may be too large. Try a smaller or more focused repo."
    : is429
    ? "Gemini API quota exceeded. Please wait a moment and try again."
    : `AI analysis failed: ${errorMsg}`;

  return res.status(504).json({ error: friendlyMsg });
}));

module.exports = router;
