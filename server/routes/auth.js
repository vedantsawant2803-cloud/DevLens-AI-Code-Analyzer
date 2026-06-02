const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const router = express.Router();
const { assertEnv } = require("../config/env");
const asyncHandler = require("../middleware/asyncHandler");
const getGitHubToken = require("../middleware/getToken");

const env = assertEnv();
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const pendingStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

function createOAuthState() {
  const state = crypto.randomBytes(20).toString("hex");
  pendingStates.set(state, Date.now() + STATE_TTL_MS);
  return state;
}

function verifyOAuthState(state) {
  if (!state || !pendingStates.has(state)) return false;
  const expires = pendingStates.get(state);
  pendingStates.delete(state);
  return Date.now() <= expires;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function setAuthCookies(res, token, user) {
  res.cookie("github_token", token, cookieOptions());
  res.cookie("github_user", JSON.stringify({
    login: user.login,
    avatar: user.avatar_url,
    name: user.name || user.login,
  }), {
    ...cookieOptions(),
    httpOnly: false,
  });
}

function clearAuthCookies(res) {
  res.clearCookie("github_token", { path: "/" });
  res.clearCookie("github_user", { path: "/" });
}

// GET /api/auth/github
router.get("/github", (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(501).json({
      error: "GitHub OAuth not configured. Paste a Personal Access Token in Settings instead.",
    });
  }

  const state = createOAuthState();
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${env.apiPublicUrl}/api/auth/callback`,
    scope: "read:user repo",
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// GET /api/auth/callback — token stored in httpOnly cookie (never in URL)
router.get("/callback", asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  if (!code || !verifyOAuthState(state)) {
    return res.redirect(`${env.clientUrl}?auth=failed&reason=csrf`);
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.redirect(`${env.clientUrl}?auth=failed`);
  }

  const { data: tokenData } = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: "application/json" }, timeout: 15000 }
  );

  if (!tokenData.access_token) {
    return res.redirect(`${env.clientUrl}?auth=failed`);
  }

  const { data: user } = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
    timeout: 15000,
  });

  setAuthCookies(res, tokenData.access_token, user);
  res.redirect(`${env.clientUrl}/auth/callback?success=1`);
}));

// POST /api/auth/token — validate PAT and set secure cookie
router.post("/token", asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== "string" || token.length < 20 || token.length > 200) {
    return res.status(400).json({ error: "Invalid token format" });
  }

  const { data: user } = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token.trim()}` },
    timeout: 15000,
  });

  setAuthCookies(res, token.trim(), user);
  res.json({ login: user.login, avatar: user.avatar_url, name: user.name });
}));

// GET /api/auth/me
router.get("/me", asyncHandler(async (req, res) => {
  const token = getGitHubToken(req);
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const { data } = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });
    res.json({ login: data.login, avatar: data.avatar_url, name: data.name });
  } catch {
    clearAuthCookies(res);
    res.status(401).json({ error: "Session expired" });
  }
}));

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

module.exports = router;
