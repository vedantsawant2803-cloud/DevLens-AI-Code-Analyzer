const express = require("express");
const router = express.Router();
const { sanitizeBadgeSlug, escapeXml } = require("../utils/validate");
const { assertEnv } = require("../config/env");

const env = assertEnv();
const scoreCache = new Map();
const CACHE_MAX = 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function setCachedScore(owner, repo, score, level) {
  const key = `${owner}/${repo}`.toLowerCase();
  if (scoreCache.size >= CACHE_MAX) {
    const firstKey = scoreCache.keys().next().value;
    scoreCache.delete(firstKey);
  }
  scoreCache.set(key, { score, level, updatedAt: Date.now() });
}

function getCachedScore(owner, repo) {
  const entry = scoreCache.get(`${owner}/${repo}`.toLowerCase());
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > CACHE_TTL_MS) {
    scoreCache.delete(`${owner}/${repo}`.toLowerCase());
    return null;
  }
  return entry;
}

function scoreColor(score) {
  if (score >= 75) return "#00ff9d";
  if (score >= 50) return "#ff9500";
  return "#ff3b5c";
}

router.post("/cache", (req, res) => {
  const owner = sanitizeBadgeSlug(req.body?.owner);
  const repo = sanitizeBadgeSlug(req.body?.repo);
  const score = Number(req.body?.score);

  if (!owner || !repo || Number.isNaN(score) || score < 0 || score > 100) {
    return res.status(400).json({ error: "Invalid owner, repo, or score" });
  }

  setCachedScore(owner, repo, Math.round(score), req.body?.level || "");
  res.json({ ok: true });
});

router.get("/:owner/:repo.svg", (req, res) => {
  const owner = sanitizeBadgeSlug(req.params.owner);
  const repo = sanitizeBadgeSlug(req.params.repo);

  if (!owner || !repo) {
    return res.status(400).send("Invalid repository");
  }

  const cached = getCachedScore(owner, repo);
  const score = cached?.score ?? "—";
  const color = typeof score === "number" ? scoreColor(score) : "#4a5980";
  const label = escapeXml("DevLens");
  const scoreText = escapeXml(String(score));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" role="img" aria-label="${label}: ${scoreText}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="120" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="62" height="20" fill="#0d1422"/>
    <rect x="62" width="58" height="20" fill="${color}"/>
    <rect width="120" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="31" y="14" fill="#00e5ff">${label}</text>
    <text x="91" y="14" fill="#080c14">${scoreText}</text>
  </g>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(svg);
});

router.get("/markdown/:owner/:repo", (req, res) => {
  const owner = sanitizeBadgeSlug(req.params.owner);
  const repo = sanitizeBadgeSlug(req.params.repo);
  if (!owner || !repo) return res.status(400).json({ error: "Invalid repository" });

  const badgeUrl = `${env.apiPublicUrl}/api/badge/${owner}/${repo}.svg`;
  res.json({
    markdown: `[![DevLens Score](${badgeUrl})](https://github.com/${owner}/${repo})`,
    badgeUrl,
  });
});

module.exports = router;
