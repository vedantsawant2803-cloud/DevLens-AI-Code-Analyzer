/**
 * Validates required environment variables at startup.
 */
function loadEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const warnings = [];
  const errors = [];

  if (!process.env.GEMINI_API_KEY) {
    errors.push("GEMINI_API_KEY is required");
  }

  if (isProd && !process.env.GITHUB_TOKEN) {
    warnings.push("GITHUB_TOKEN not set — public API rate limits will apply");
  }

  if (isProd && process.env.CLIENT_URL === "http://localhost:5173") {
    warnings.push("CLIENT_URL still points to localhost in production");
  }

  if (process.env.GITHUB_CLIENT_ID && !process.env.GITHUB_CLIENT_SECRET) {
    errors.push("GITHUB_CLIENT_SECRET required when GITHUB_CLIENT_ID is set");
  }

  return {
    isProd,
    port: parseInt(process.env.PORT || "5000", 10),
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean),
    apiPublicUrl: process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`,
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    cookieSecret: process.env.COOKIE_SECRET || "devlens-dev-secret-change-in-production",
    warnings,
    errors,
  };
}

function assertEnv() {
  const config = loadEnv();
  config.warnings.forEach((w) => console.warn(`[env] WARNING: ${w}`));
  if (config.errors.length) {
    config.errors.forEach((e) => console.error(`[env] ERROR: ${e}`));
    if (config.isProd) process.exit(1);
  }
  return config;
}

module.exports = { loadEnv, assertEnv };
