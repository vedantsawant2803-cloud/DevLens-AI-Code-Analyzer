const API_TIMEOUT_MS = 120000;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

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
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. The repository may be too large — try a smaller repo.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
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

export async function runFullAnalysis(url, { focus = "fullstack" } = {}) {
  if (!isValidGitHubUrl(url)) {
    throw new Error("Enter a valid https://github.com/user/repo URL");
  }

  const info = await apiFetch(`/api/repo/info?url=${encodeURIComponent(url.trim())}`);
  const filesData = await apiFetch("/api/repo/files", {
    method: "POST",
    body: JSON.stringify({ url: url.trim() }),
  });
  const insights = await apiFetch(`/api/repo/insights?url=${encodeURIComponent(url.trim())}`).catch(() => null);
  const analyzeData = await apiFetch("/api/analyze", {
    method: "POST",
    body: JSON.stringify({
      files: filesData.files,
      repoName: `${filesData.owner}/${filesData.repo}`,
      focus,
    }),
  });

  if (info.owner && info.name && analyzeData.analysis?.overallScore != null) {
    await apiFetch("/api/badge/cache", {
      method: "POST",
      body: JSON.stringify({
        owner: info.owner,
        repo: info.name,
        score: analyzeData.analysis.overallScore,
        level: analyzeData.analysis.level,
      }),
    }).catch(() => {});
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
  { url: "https://github.com/facebook/react", label: "facebook/react", desc: "UI library" },
  { url: "https://github.com/expressjs/express", label: "expressjs/express", desc: "Node backend" },
  { url: "https://github.com/vercel/next.js", label: "vercel/next.js", desc: "Full-stack framework" },
  { url: "https://github.com/vedantsawant2803-cloud/DevLens-AI-Code-Analyzer", label: "DevLens (this app)", desc: "Analyze yourself" },
];
