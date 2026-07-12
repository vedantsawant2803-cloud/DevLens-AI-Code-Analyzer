require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { assertEnv } = require("./config/env");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const analyzeRouter = require("./routes/analyze");
const repoRouter = require("./routes/repo");
const badgeRouter = require("./routes/badge");
const authRouter = require("./routes/auth");

const env = assertEnv();
const app = express();

if (env.isProd) {
  app.set("trust proxy", 1);
}

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (env.clientUrls.includes(origin)) return callback(null, true);
    if (!env.isProd) {
      const isLocalhost =
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin === "http://localhost" ||
        origin === "http://127.0.0.1";
      if (isLocalhost) return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "X-Github-Token"],
}));

app.use(cookieParser());
app.use(express.json({ limit: "4mb" }));

// Set generous timeouts — must be larger than AI_CALL_TIMEOUT_MS in analyze.js (85s)
app.use((req, res, next) => {
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000);
  next();
});

// Global rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProd ? 120 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: (req) => req.path === "/api/health",
});

// Tighter limiter just for the expensive analyze endpoint
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProd ? 20 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Analysis rate limit reached. Please wait before trying again." },
});

app.use("/api", apiLimiter);

// Health check — fast, always 200
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: "2.2.0",
    environment: env.isProd ? "production" : "development",
    gemini: !!process.env.GEMINI_API_KEY,
    github: !!(process.env.GITHUB_TOKEN || process.env.GITHUB_CLIENT_ID),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/analyze", analyzeLimiter, analyzeRouter);
app.use("/api/repo", repoRouter);
app.use("/api/badge", badgeRouter);
app.use("/api/auth", authRouter);

if (env.isProd) {
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist, { maxAge: "1d", index: false }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.port;
const server = app.listen(PORT, () => {
  console.log(`🚀 DevLens server v2.2 (${env.isProd ? "production" : "development"}) on port ${PORT}`);
  if (env.warnings.length) {
    env.warnings.forEach((w) => console.warn(`  ⚠  ${w}`));
  }
});

// Server-level timeout — must exceed the per-request timeout + buffer
server.timeout = 180000;          // 3 minutes
server.keepAliveTimeout = 185000; // slightly longer than timeout
server.headersTimeout = 190000;   // slightly longer than keepAlive

module.exports = app;
