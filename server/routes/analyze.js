const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const router = express.Router();

// Build the analysis prompt from repo files
function buildPrompt(files, repoName) {
  const fileSnippets = files
    .map((f) => `### File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");

  return `You are an expert senior software engineer conducting a thorough code review of the GitHub repository "${repoName}".

Analyze the following code files carefully:

${fileSnippets}

Return your analysis as a single valid JSON object (no markdown, no extra text) with exactly this shape:

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
  "summary": "<2-3 sentence executive summary of the codebase>",
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "improvements": [
    {
      "title": "<short title>",
      "description": "<what the issue is and why it matters>",
      "before": "<actual problematic code snippet from the files, max 6 lines>",
      "after": "<improved version of that same code snippet, max 6 lines>",
      "impact": "<Low | Medium | High>"
    },
    {
      "title": "<short title>",
      "description": "<what the issue is and why it matters>",
      "before": "<actual problematic code snippet from the files, max 6 lines>",
      "after": "<improved version of that same code snippet, max 6 lines>",
      "impact": "<Low | Medium | High>"
    },
    {
      "title": "<short title>",
      "description": "<what the issue is and why it matters>",
      "before": "<actual problematic code snippet from the files, max 6 lines>",
      "after": "<improved version of that same code snippet, max 6 lines>",
      "impact": "<Low | Medium | High>"
    }
  ],
  "skillGaps": [
    {
      "skill": "<skill name>",
      "currentLevel": "<Beginner | Intermediate | Advanced>",
      "recommendation": "<specific actionable learning recommendation>"
    },
    {
      "skill": "<skill name>",
      "currentLevel": "<Beginner | Intermediate | Advanced>",
      "recommendation": "<specific actionable learning recommendation>"
    },
    {
      "skill": "<skill name>",
      "currentLevel": "<Beginner | Intermediate | Advanced>",
      "recommendation": "<specific actionable learning recommendation>"
    }
  ],
  "techStack": ["<detected technology 1>", "<detected technology 2>", "<detected technology 3>"]
}

Be specific and reference actual code from the files. Be honest but constructive. Calibrate scores fairly — most repos should score 30-75 range.`;
}

// POST /api/analyze  { files: [...], repoName: "..." }
router.post("/", async (req, res) => {
  const { files, repoName } = req.body;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "No files provided for analysis" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key not configured on server" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // gemini-1.5-flash is completely free — 15 RPM, 1M tokens/day
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = buildPrompt(files, repoName || "repository");
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Strip any accidental markdown code fences before parsing
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response:", rawText);
      return res.status(500).json({ error: "AI returned malformed response. Please try again." });
    }

    res.json({ analysis, repoName });
  } catch (err) {
    console.error("Gemini API error:", err.message);
    if (err.message?.includes("API_KEY_INVALID")) return res.status(500).json({ error: "Invalid Gemini API key" });
    if (err.message?.includes("RESOURCE_EXHAUSTED")) return res.status(429).json({ error: "Gemini rate limit hit. Wait a moment and try again." });
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

module.exports = router;
