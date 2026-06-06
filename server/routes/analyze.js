const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const router = express.Router();
const { validateFocus, validateAnalysisPayload } = require("../utils/validate");
const asyncHandler = require("../middleware/asyncHandler");
const { assertEnv } = require("../config/env");

const env = assertEnv();

const FOCUS_PROMPTS = {
  fullstack: "Review as a full-stack engineer covering frontend, backend, and DevOps holistically.",
  frontend: "Review primarily as a frontend engineer — focus on UI patterns, React/component architecture, accessibility, and client performance.",
  backend: "Review primarily as a backend engineer — focus on API design, data flow, error handling, security, and scalability.",
  security: "Review primarily as a security engineer — focus on vulnerabilities, auth, input validation, secrets, and OWASP risks.",
  devops: "Review primarily as a DevOps engineer — focus on deployment, CI/CD, configuration, monitoring, and infrastructure.",
};

function buildPrompt(files, repoName, focus = "fullstack") {
  const fileSnippets = files
    .map((f) => `### File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");

  const focusInstruction = FOCUS_PROMPTS[focus] || FOCUS_PROMPTS.fullstack;

  return `You are an expert senior software engineer conducting a thorough code review of the GitHub repository "${repoName}".

${focusInstruction}

Analyze the following code files carefully:

${fileSnippets}

Return your analysis as a single valid JSON object with exactly this shape:

{
  "scores": {
    "cleanCode": <0-100 integer>,
    "performance": <0-100 integer>,
    "security": <0-100 integer>,
    "scalability": <0-100 integer>,
    "documentation": <0-100 integer>
  },
  "overallScore": <0-100 integer, weighted average>,
  "level": "<one of: Beginner | Intermediate | Advanced | Expert>",
  "summary": "<2-3 sentence executive summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": [
    {
      "title": "<short title>",
      "description": "<what the issue is and why it matters>",
      "file": "<file path this relates to>",
      "before": "<actual code snippet, max 6 lines>",
      "after": "<improved code snippet, max 6 lines>",
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
  "fixItPrompt": "<A detailed prompt for Cursor/Copilot to fix the top 3 issues. 3-5 sentences.>"
}

Include exactly 3 improvements and 3 skillGaps. Include fileBreakdown for up to 8 files. Be specific. Calibrate scores fairly — most repos score 30-75.`;
}

function parseJsonResponse(rawText) {
  const cleaned = rawText.replace(/```json\s*|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Invalid JSON response from AI");
  }
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
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const prompt = buildPrompt(payloadCheck.files, safeRepoName, focus);

  const modelsToTry = [
    env.geminiModel,
    "gemini-2.0-flash",
    "gemini-flash-latest"
  ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicate

  let lastError = null;

  for (const modelName of modelsToTry) {
    console.log(`[analyze] Attempting analysis with model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await model.generateContent(prompt);
          const rawText = result.response.text();
          const analysis = parseJsonResponse(rawText);
          
          if (!analysis.improvements) analysis.improvements = [];
          if (!analysis.fileBreakdown) analysis.fileBreakdown = [];
          if (!analysis.fixItPrompt) {
            analysis.fixItPrompt = `Fix the top code quality issues in ${safeRepoName}. Focus on: ${analysis.improvements.slice(0, 3).map((i) => i.title).join(", ")}.`;
          }
          return res.json({ analysis, repoName: safeRepoName, focus });
        } catch (err) {
          lastError = err;
          console.warn(`[analyze] Model ${modelName} (attempt ${attempt + 1}) failed: ${err.message}`);
          
          const isNetworkOrRateLimit = err.message && (
            err.message.includes("503") || 
            err.message.includes("429") || 
            err.message.includes("Service Unavailable") ||
            err.message.includes("resource exhausted")
          );
          
          if (isNetworkOrRateLimit) {
            break; // break the attempt loop to try the next model
          }
        }
      }
    } catch (err) {
      lastError = err;
      console.warn(`[analyze] Failed to initialize model ${modelName}: ${err.message}`);
    }
  }

  console.error("[analyze] All models failed. Last error:", lastError);
  return res.status(500).json({ 
    error: `AI analysis failed. ${lastError ? lastError.message : "Please try again."}` 
  });
}));

module.exports = router;
