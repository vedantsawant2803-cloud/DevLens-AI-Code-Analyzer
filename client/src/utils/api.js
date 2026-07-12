// 3 minutes — matches server timeout budget
const API_TIMEOUT_MS = 180000;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Fetch with automatic timeout and credential forwarding.
 * Throws an Error with a user-friendly message on failure.
 */
export async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const serverMsg = data?.error || "";
      const friendlyMsg = getFriendlyError(res.status, serverMsg);
      throw new Error(friendlyMsg);
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        "Request timed out after 3 minutes. The repository may be too large — try a smaller repo or a specific PR URL."
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Maps HTTP status codes to user-friendly messages.
 */
function getFriendlyError(status, serverMsg) {
  if (serverMsg) return serverMsg; // prefer server's own message

  switch (status) {
    case 400: return "Invalid request — check the repository URL and try again.";
    case 401: return "Authentication failed — please reconnect your GitHub account.";
    case 403: return "GitHub rate limit exceeded — try connecting a GitHub token in Settings.";
    case 404: return "Repository not found or is private — connect GitHub to access private repos.";
    case 422: return "No supported code files found in this repository.";
    case 429: return "Too many requests — please wait a moment before trying again.";
    case 500: return "Server error — please try again.";
    case 502: return "GitHub API error — please try again.";
    case 503: return "Service temporarily unavailable — please try again shortly.";
    case 504: return "Analysis timed out — the repository may be too large. Try a smaller repo or PR URL.";
    default:  return `Request failed (HTTP ${status})`;
  }
}

export function isValidGitHubUrl(url) {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`);
    return parsed.protocol === "https:" && parsed.hostname === "github.com";
  } catch {
    return false;
  }
}

/**
 * Full analysis pipeline.
 *
 * Optimisation: repo/info and repo/insights are both read-only GET requests
 * — run them in parallel with file fetching so they don't add to the critical path.
 */
export async function runFullAnalysis(url, { focus = "fullstack" } = {}) {
  if (!isValidGitHubUrl(url)) {
    throw new Error("Enter a valid https://github.com/user/repo URL");
  }

  const trimmedUrl = url.trim();

  // Phase 1: Fetch repo metadata + files in parallel (both needed before AI call)
  const [info, filesData] = await Promise.all([
    apiFetch(`/api/repo/info?url=${encodeURIComponent(trimmedUrl)}`),
    apiFetch("/api/repo/files", {
      method: "POST",
      body: JSON.stringify({ url: trimmedUrl }),
    }),
  ]);

  // Phase 2: Kick off insights fetch in parallel with AI analysis
  //          (insights is nice-to-have; we don't block on it)
  const [analyzeData, insights] = await Promise.all([
    apiFetch("/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        files: filesData.files,
        repoName: `${filesData.owner}/${filesData.repo}`,
        focus,
      }),
    }),
    apiFetch(`/api/repo/insights?url=${encodeURIComponent(trimmedUrl)}`).catch(() => null),
  ]);

  // Phase 3: Cache badge score in background — don't block navigation
  if (info.owner && info.name && analyzeData.analysis?.overallScore != null) {
    apiFetch("/api/badge/cache", {
      method: "POST",
      body: JSON.stringify({
        owner: info.owner,
        repo: info.name,
        score: analyzeData.analysis.overallScore,
        level: analyzeData.analysis.level,
      }),
    }).catch(() => {}); // fire-and-forget
  }

  return { info, filesData, insights, analysis: analyzeData.analysis, focus };
}

export const FOCUS_OPTIONS = [
  { id: "fullstack", label: "Full Stack", desc: "Holistic review" },
  { id: "frontend", label: "Frontend", desc: "UI & components" },
  { id: "backend", label: "Backend", desc: "APIs & data" },
  { id: "security", label: "Security", desc: "Vulnerabilities" },
  { id: "devops", label: "DevOps", desc: "Deploy & CI/CD" },
];

export const SAMPLE_REPOS = [
  { url: "https://github.com/expressjs/express", label: "expressjs/express", desc: "Node backend" },
  { url: "https://github.com/vitejs/vite", label: "vitejs/vite", desc: "Frontend tooling" },
  { url: "https://github.com/fastapi/fastapi", label: "fastapi/fastapi", desc: "Python API framework" },
  { url: "https://github.com/vedantsawant2803-cloud/DevLens-AI-Code-Analyzer", label: "DevLens (this app)", desc: "Analyze yourself" },
];
