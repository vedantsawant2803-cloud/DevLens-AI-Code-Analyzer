const axios = require("axios");
const { isValidSlug } = require("./validate");

const CODE_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py", ".java", ".go", ".rs", ".cpp", ".c", ".cs", ".rb", ".php",
  ".vue", ".svelte", ".swift", ".kt", ".kts", ".sql", ".sh", ".html", ".css", ".scss",
];

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "vendor", "coverage",
  "__pycache__", ".venv", "target", "bin", "obj",
]);

const MAX_FILES = 25;
const MAX_FILE_CHARS = 3000;

function parseGitHubUrl(url) {
  try {
    const cleaned = decodeURIComponent(url.replace(/\.git$/, "").trim());

    const prMatch = cleaned.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
    if (prMatch) {
      const owner = prMatch[1];
      const repo = prMatch[2];
      if (!isValidSlug(owner) || !isValidSlug(repo)) return null;
      return { owner, repo, prNumber: parseInt(prMatch[3], 10) };
    }

    const treeIdx = cleaned.search(/github\.com\/[^/]+\/[^/]+\/tree\//i);
    if (treeIdx !== -1) {
      const afterTree = cleaned.slice(treeIdx).replace(/^.*?\/tree\//i, "");
      const ref = afterTree.split(/[?#]/)[0];
      const baseMatch = cleaned.match(/github\.com\/([^/]+)\/([^/]+)\/tree\//i);
      if (baseMatch && ref) {
        const owner = baseMatch[1];
        const repo = baseMatch[2];
        if (!isValidSlug(owner) || !isValidSlug(repo)) return null;
        return { owner, repo, ref: decodeURIComponent(ref) };
      }
    }

    const match = cleaned.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
    if (!match) return null;
    const owner = match[1];
    const repo = match[2].replace(/\/$/, "");
    if (!isValidSlug(owner) || !isValidSlug(repo)) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

function getGitHubHeaders(userToken) {
  const token = userToken || process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

function shouldSkipPath(filePath) {
  const parts = filePath.split("/");
  return parts.some((part) => SKIP_DIRS.has(part));
}

function isCodeFile(filePath) {
  return CODE_EXTENSIONS.some((ext) => filePath.toLowerCase().endsWith(ext));
}

async function fetchRawFile(owner, repo, path, ref, headers) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${encodedPath}`;
  const { data } = await axios.get(url, { headers, responseType: "text", timeout: 15000 });
  return String(data).slice(0, MAX_FILE_CHARS);
}

async function fetchPRFiles(owner, repo, prNumber, headers) {
  const { data: prFiles } = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
    { headers }
  );

  const files = [];
  for (const item of prFiles) {
    if (files.length >= MAX_FILES) break;
    if (item.status === "removed" || !isCodeFile(item.filename)) continue;

    files.push({
      path: item.filename,
      content: (item.patch || item.contents_url || "").slice(0, MAX_FILE_CHARS),
      size: item.changes,
      source: "pull_request",
    });
  }
  return files;
}

async function fetchRepoFiles(owner, repo, options = {}) {
  const { ref, userToken, prNumber } = options;
  const headers = getGitHubHeaders(userToken);

  if (prNumber) {
    const files = await fetchPRFiles(owner, repo, prNumber, headers);
    return { files, branch: `pr-${prNumber}`, defaultBranch: null };
  }

  const { data: repoData } = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers }
  );

  const branch = ref || repoData.default_branch;

  let treeSha;
  try {
    const { data: branchData } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
      { headers }
    );
    treeSha = branchData.commit.commit.tree.sha;
  } catch {
    const { data: refData } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
      { headers }
    );
    const { data: commitData } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${refData.object.sha}`,
      { headers }
    );
    treeSha = commitData.tree.sha;
  }

  const { data: treeData } = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    { headers }
  );

  const candidates = (treeData.tree || [])
    .filter(
      (item) =>
        item.type === "blob" &&
        isCodeFile(item.path) &&
        !shouldSkipPath(item.path) &&
        !item.path.includes("package-lock.json") &&
        !item.path.includes("yarn.lock")
    )
    .slice(0, MAX_FILES);

  const files = [];
  for (const item of candidates) {
    try {
      const content = await fetchRawFile(owner, repo, item.path, branch, headers);
      files.push({ path: item.path, content, size: item.size || content.length });
    } catch {
      // skip unreadable files
    }
  }

  return { files, branch, defaultBranch: repoData.default_branch };
}

async function fetchRepoInsights(owner, repo, options = {}) {
  const headers = getGitHubHeaders(options.userToken);

  const [repoRes, commitsRes, readmeRes] = await Promise.allSettled([
    axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
    axios.get(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`, { headers }),
    axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers }),
  ]);

  const repoData = repoRes.status === "fulfilled" ? repoRes.value.data : null;
  const commits = commitsRes.status === "fulfilled" ? commitsRes.value.data : [];
  let readmeContent = "";

  if (readmeRes.status === "fulfilled") {
    const encoded = readmeRes.value.data.content?.replace(/\n/g, "") || "";
    readmeContent = Buffer.from(encoded, "base64").toString("utf-8");
  }

  const lastPush = repoData?.pushed_at ? new Date(repoData.pushed_at) : null;
  const daysSincePush = lastPush
    ? Math.floor((Date.now() - lastPush.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const commitActivity = {
    lastPush: repoData?.pushed_at || null,
    daysSincePush,
    recentCommits: commits.slice(0, 5).map((c) => ({
      message: c.commit?.message?.split("\n")[0] || "",
      author: c.commit?.author?.name || c.author?.login || "Unknown",
      date: c.commit?.author?.date || null,
    })),
    activityLevel:
      daysSincePush === null ? "unknown" :
      daysSincePush <= 7 ? "active" :
      daysSincePush <= 30 ? "moderate" :
      daysSincePush <= 180 ? "stale" : "inactive",
  };

  const readmeScore = scoreReadme(readmeContent);
  const techBadges = detectTechBadges(repoData, readmeContent);
  const dependencies = await scanDependencies(owner, repo, headers);

  return { commitActivity, readmeScore, techBadges, dependencies };
}

function scoreReadme(content) {
  if (!content.trim()) {
    return { score: 0, checks: [{ label: "README exists", passed: false }] };
  }

  const checks = [
    { label: "Has project title (# heading)", passed: /^#\s+.+/m.test(content) },
    { label: "Has description", passed: content.split("\n").filter((l) => l.trim()).length > 5 },
    { label: "Installation / setup section", passed: /install|setup|getting started|run/i.test(content) },
    { label: "Usage examples", passed: /usage|example|how to|```/i.test(content) },
    { label: "License mentioned", passed: /license|mit|apache|gpl/i.test(content) },
    { label: "Badges or shields", passed: /!\[.*\]\(.*\)|badge|shields\.io/i.test(content) },
    { label: "Contributing guide", passed: /contribut/i.test(content) },
  ];

  const passed = checks.filter((c) => c.passed).length;
  return {
    score: Math.round((passed / checks.length) * 100),
    checks,
    length: content.length,
  };
}

function detectTechBadges(repoData, readme) {
  const text = `${readme} ${repoData?.language || ""}`.toLowerCase();
  const catalog = [
    { name: "React", key: "react", icon: "⚛️", test: /react/ },
    { name: "Node.js", key: "nodejs", icon: "🟢", test: /node\.?js|express/ },
    { name: "TypeScript", key: "typescript", icon: "🔷", test: /typescript|\.ts/ },
    { name: "Python", key: "python", icon: "🐍", test: /python|django|flask/ },
    { name: "Docker", key: "docker", icon: "🐳", test: /docker/ },
    { name: "MongoDB", key: "mongodb", icon: "🍃", test: /mongodb|mongoose/ },
    { name: "PostgreSQL", key: "postgres", icon: "🐘", test: /postgres|postgresql/ },
    { name: "Tailwind", key: "tailwind", icon: "🎨", test: /tailwind/ },
    { name: "Vite", key: "vite", icon: "⚡", test: /vite/ },
    { name: "Next.js", key: "nextjs", icon: "▲", test: /next\.?js/ },
    { name: "GraphQL", key: "graphql", icon: "◈", test: /graphql/ },
    { name: "Redis", key: "redis", icon: "🔴", test: /redis/ },
  ];

  return catalog
    .filter((item) => item.test.test(text))
    .map(({ name, key, icon }) => ({
      name,
      key,
      icon,
      maturity: repoData?.stargazers_count > 100 ? "established" : "emerging",
    }));
}

async function scanDependencies(owner, repo, headers) {
  const manifests = [
    { file: "package.json", type: "npm" },
    { file: "requirements.txt", type: "pip" },
    { file: "pyproject.toml", type: "pip" },
  ];

  const results = [];

  for (const manifest of manifests) {
    try {
      const { data: repoData } = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
      );
      const branch = repoData.default_branch;
      const content = await fetchRawFile(owner, repo, manifest.file, branch, headers);

      if (manifest.type === "npm") {
        let pkg;
        try {
          pkg = JSON.parse(content);
        } catch {
          continue;
        }
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        const depList = Object.entries(deps).slice(0, 20).map(([name, version]) => ({
          name,
          version: version.replace(/^[\^~]/, ""),
          type: "npm",
          status: version.includes("latest") || version === "*" ? "risky" : "ok",
        }));
        results.push({
          manifest: manifest.file,
          type: "npm",
          count: Object.keys(deps).length,
          dependencies: depList,
          hasLockFile: true,
          notes: depList.filter((d) => d.status === "risky").length
            ? "Some dependencies use open-ended version ranges"
            : "Dependency versions look pinned",
        });
      } else if (manifest.type === "pip") {
        const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
        results.push({
          manifest: manifest.file,
          type: "pip",
          count: lines.length,
          dependencies: lines.slice(0, 15).map((line) => {
            const [name, version] = line.split(/[=<>]/);
            return { name: name?.trim(), version: version?.trim() || "any", type: "pip", status: "ok" };
          }),
          notes: "Review versions against PyPI for security advisories",
        });
      }
      break;
    } catch {
      // try next manifest
    }
  }

  if (!results.length) {
    return { manifest: null, count: 0, dependencies: [], notes: "No dependency manifest detected" };
  }
  return results[0];
}

module.exports = {
  parseGitHubUrl,
  getGitHubHeaders,
  fetchRepoFiles,
  fetchRepoInsights,
  CODE_EXTENSIONS,
};
