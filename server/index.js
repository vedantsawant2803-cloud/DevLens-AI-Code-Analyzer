require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const analyzeRouter = require("./routes/analyze");
const repoRouter = require("./routes/repo");

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting — protect the AI endpoint from abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Too many requests, please try again later." },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));
app.use("/api/analyze", limiter);

// Routes
app.use("/api/analyze", analyzeRouter);
app.use("/api/repo", repoRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 DevLens server running on http://localhost:${PORT}`);
});
