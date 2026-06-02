const GITHUB_HOST = "github.com";
const SLUG_REGEX = /^[a-zA-Z0-9._-]{1,100}$/;
const MAX_URL_LENGTH = 500;
const VALID_FOCUS = new Set(["fullstack", "frontend", "backend", "security", "devops"]);
const MAX_FILES_PER_ANALYSIS = 25;
const MAX_FILE_CONTENT = 3000;
const MAX_TOTAL_PROMPT_CHARS = 120000;

function isValidSlug(slug) {
  return typeof slug === "string" && slug.length >= 1 && slug.length <= 100 && SLUG_REGEX.test(slug);
}

/**
 * Only allow https://github.com URLs — blocks SSRF to internal services.
 */
function validateGitHubUrl(url) {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "URL is required" };
  }

  const trimmed = url.trim();
  if (trimmed.length > MAX_URL_LENGTH) {
    return { valid: false, error: "URL is too long" };
  }

  let parsed;
  try {
    parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS GitHub URLs are allowed" };
  }

  if (parsed.hostname !== GITHUB_HOST && parsed.hostname !== `www.${GITHUB_HOST}`) {
    return { valid: false, error: "Only github.com URLs are supported" };
  }

  return { valid: true, normalized: parsed.href.replace(/\/$/, "") };
}

function validateFocus(focus) {
  if (!focus) return "fullstack";
  if (!VALID_FOCUS.has(focus)) return null;
  return focus;
}

function validateAnalysisPayload(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return { valid: false, error: "No files provided for analysis" };
  }

  if (files.length > MAX_FILES_PER_ANALYSIS) {
    return { valid: false, error: `Too many files (max ${MAX_FILES_PER_ANALYSIS})` };
  }

  let totalChars = 0;
  for (const file of files) {
    if (!file?.path || typeof file.path !== "string") {
      return { valid: false, error: "Each file must have a path" };
    }
    if (file.path.length > 500 || file.path.includes("..")) {
      return { valid: false, error: "Invalid file path" };
    }
    const content = String(file.content || "");
    if (content.length > MAX_FILE_CONTENT) {
      file.content = content.slice(0, MAX_FILE_CONTENT);
    }
    totalChars += content.length;
  }

  if (totalChars > MAX_TOTAL_PROMPT_CHARS) {
    return { valid: false, error: "Total code size exceeds analysis limit" };
  }

  return { valid: true, files };
}

function sanitizeBadgeSlug(value) {
  if (!value || typeof value !== "string") return null;
  const clean = value.replace(/\.svg$/i, "").slice(0, 100);
  return isValidSlug(clean) ? clean : null;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = {
  validateGitHubUrl,
  validateFocus,
  validateAnalysisPayload,
  sanitizeBadgeSlug,
  escapeXml,
  isValidSlug,
  MAX_FILES_PER_ANALYSIS,
};
