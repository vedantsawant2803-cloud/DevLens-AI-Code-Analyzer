const express = require("express");
const axios = require("axios");
const {
  parseGitHubUrl,
  getGitHubHeaders,
  fetchRepoFiles,
  fetchRepoInsights,
} = require("../utils/github");
const { validateGitHubUrl } = require("../utils/validate");
const asyncHandler = require("../middleware/asyncHandler");
const getGitHubToken = require("../middleware/getToken");
const { debugLog } = require("../utils/debugLog");

const router = express.Router();

function parseAndValidateUrl(url) {
  const check = validateGitHubUrl(url);
  if (!check.valid) return { error: check.error };
  const parsed = parseGitHubUrl(check.normalized || url);
  if (!parsed) return { error: "Could not parse GitHub repository from URL" };
  return { parsed, normalized: check.normalized };
}

router.get("/info", asyncHandler(async (req, res) => {
  const { url } = req.query;
  const result = parseAndValidateUrl(url);
  if (result.error) return res.status(400).json({ error: result.error });

  const headers = getGitHubHeaders(getGitHubToken(req));
  const { data } = await axios.get(
    `https://api.github.com/repos/${result.parsed.owner}/${result.parsed.repo}`,
    { headers, timeout: 20000 }
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
    defaultBranch: data.default_branch,
    isPrivate: data.private,
    openIssues: data.open_issues_count,
    pushedAt: data.pushed_at,
    ...(result.parsed.ref && { ref: result.parsed.ref }),
    ...(result.parsed.prNumber && { prNumber: result.parsed.prNumber }),
  });
}));

router.post("/files", asyncHandler(async (req, res) => {
  const { url } = req.body;
  const result = parseAndValidateUrl(url);
  if (result.error) return res.status(400).json({ error: result.error });

  const filesStart = Date.now();
  // #region agent log
  debugLog("repo.js:/files", "files request", { url: result.normalized, owner: result.parsed.owner, repo: result.parsed.repo }, "B");
  // #endregion

  const { files, branch } = await fetchRepoFiles(result.parsed.owner, result.parsed.repo, {
    ref: result.parsed.ref,
    prNumber: result.parsed.prNumber,
    userToken: getGitHubToken(req),
  });

  if (!files.length) {
    // #region agent log
    debugLog("repo.js:/files", "no files found", { url: result.normalized, elapsedMs: Date.now() - filesStart }, "C");
    // #endregion
    return res.status(422).json({
      error: "No supported code files found. Use a public repo with .js, .ts, .py, or similar files, or connect GitHub for private repos.",
    });
  }

  // #region agent log
  debugLog("repo.js:/files", "files success", { fileCount: files.length, branch, elapsedMs: Date.now() - filesStart }, "B");
  // #endregion

  res.json({
    files,
    owner: result.parsed.owner,
    repo: result.parsed.repo,
    branch,
    ...(result.parsed.prNumber && { prNumber: result.parsed.prNumber }),
  });
}));

router.get("/insights", asyncHandler(async (req, res) => {
  const { url } = req.query;
  const result = parseAndValidateUrl(url);
  if (result.error) return res.status(400).json({ error: result.error });

  const insights = await fetchRepoInsights(result.parsed.owner, result.parsed.repo, {
    userToken: getGitHubToken(req),
  });
  res.json(insights);
}));

module.exports = router;
