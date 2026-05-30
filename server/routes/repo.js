const express = require("express");
const axios = require("axios");
const router = express.Router();

// Parses a GitHub URL into owner and repo name
function parseGitHubUrl(url) {
  try {
    const cleaned = url.replace(/\.git$/, "").trim();
    const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  } catch {
    return null;
  }
}

// Recursively fetches all files in a repo up to a depth/count limit
async function fetchRepoFiles(owner, repo, path = "", depth = 0) {
  if (depth > 3) return []; // Don't go too deep

  const headers = {
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  };

  const { data } = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers }
  );

  const files = [];
  const codeExtensions = [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rs", ".cpp", ".c", ".cs", ".rb", ".php"];

  for (const item of data) {
    if (files.length > 25) break; // Cap at 25 files to keep prompt size sane

    if (item.type === "file" && codeExtensions.some((ext) => item.name.endsWith(ext))) {
      try {
        const fileRes = await axios.get(item.download_url);
        files.push({
          path: item.path,
          content: fileRes.data.toString().slice(0, 3000), // Limit each file to 3000 chars
          size: item.size,
        });
      } catch {
        // Skip unreadable files silently
      }
    } else if (item.type === "dir" && !["node_modules", ".git", "dist", "build", ".next"].includes(item.name)) {
      const nested = await fetchRepoFiles(owner, repo, item.path, depth + 1);
      files.push(...nested);
    }

    if (files.length >= 25) break;
  }

  return files;
}

// GET /api/repo/info?url=...
router.get("/info", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "GitHub URL is required" });

  const parsed = parseGitHubUrl(url);
  if (!parsed) return res.status(400).json({ error: "Invalid GitHub URL" });

  try {
    const headers = {
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }),
    };

    const { data } = await axios.get(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers }
    );

    res.json({
      name: data.name,
      owner: data.owner.login,
      avatar: data.owner.avatar_url,
      description: data.description,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      url: data.html_url,
    });
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) return res.status(404).json({ error: "Repository not found or is private" });
    res.status(500).json({ error: "Failed to fetch repository info" });
  }
});

// POST /api/repo/files  { url }
router.post("/files", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "GitHub URL is required" });

  const parsed = parseGitHubUrl(url);
  if (!parsed) return res.status(400).json({ error: "Invalid GitHub URL" });

  try {
    const files = await fetchRepoFiles(parsed.owner, parsed.repo);
    if (!files.length) {
      return res.status(422).json({ error: "No supported code files found in this repository" });
    }
    res.json({ files, owner: parsed.owner, repo: parsed.repo });
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) return res.status(404).json({ error: "Repository not found or is private" });
    if (status === 403) return res.status(403).json({ error: "GitHub rate limit hit. Add a GITHUB_TOKEN to increase limits." });
    res.status(500).json({ error: "Failed to fetch repository files" });
  }
});

module.exports = router;
