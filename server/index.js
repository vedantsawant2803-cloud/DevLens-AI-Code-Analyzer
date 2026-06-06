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
    if (!origin) {
      return callback(null, true);
    }
    if (env.clientUrls.includes(origin)) {
      return callback(null, true);
    }
    if (!env.isProd) {
      const isLocalhost = origin.startsWith("http://localhost:") || 
                          origin.startsWith("http://127.0.0.1:") || 
                          origin === "http://localhost" || 
                          origin === "http://127.0.0.1";
      if (isLocalhost) {
        return callback(null, true);
      }
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "X-Github-Token"],
}));

app.use(cookieParser());
app.use(express.json({ limit: "4mb" }));

app.use((req, res, next) => {
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProd ? 100 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProd ? 15 : 40,
  message: { error: "Analysis rate limit reached. Please wait before trying again." },
});

app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: "2.1.0",
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

const server = app.listen(env.port, () => {
  console.log(`🚀 DevLens server v2.1 (${env.isProd ? "production" : "development"}) on port ${env.port}`);
});

server.timeout = 120000;
server.keepAliveTimeout = 125000;

module.exports = app;
