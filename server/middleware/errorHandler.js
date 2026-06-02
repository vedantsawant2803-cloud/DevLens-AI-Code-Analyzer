function notFoundHandler(req, res) {
  res.status(404).json({ error: "Endpoint not found" });
}

function errorHandler(err, req, res, _next) {
  if (err.response?.status) {
    const ghStatus = err.response.status;
    const message =
      ghStatus === 404 ? "Repository not found or is private. Connect GitHub to access private repos." :
      ghStatus === 403 ? "GitHub rate limit exceeded. Try again later or connect a token." :
      ghStatus === 401 ? "GitHub authentication failed." :
      "GitHub API request failed";
    return res.status(ghStatus === 404 ? 404 : ghStatus === 403 ? 403 : 502).json({ error: message });
  }

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";

  if (status >= 500) {
    console.error(`[${req.method}] ${req.path}:`, err.message);
    if (!isProd && err.stack) console.error(err.stack);
  }

  res.status(status).json({
    error: err.expose !== false ? (err.message || "Internal server error") : "Internal server error",
    ...(isProd ? {} : { code: err.code }),
  });
}

module.exports = { notFoundHandler, errorHandler };
