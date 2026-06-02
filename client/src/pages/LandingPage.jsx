import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Zap, BarChart3, BookOpen, ArrowRight, GitCompare, ListPlus, Shield, Layers } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import AppNav from "../components/AppNav";
import { FOCUS_OPTIONS, SAMPLE_REPOS, isValidGitHubUrl } from "../utils/api";

export default function LandingPage() {
  const [url, setUrl] = useState("");
  const [compareUrl, setCompareUrl] = useState("");
  const [showCompare, setShowCompare] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { focus, setFocus, addToQueue } = useAnalysis();

  useEffect(() => {
    if (searchParams.get("auth") === "failed") {
      setError("GitHub sign-in failed. Try again or paste a token in Settings.");
    }
  }, [searchParams]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return setError("Please enter a GitHub repository URL");
    if (!isValidGitHubUrl(trimmed)) return setError("Must be a valid https://github.com/user/repo URL");
    setError("");

    if (showCompare && compareUrl.trim()) {
      navigate("/compare", { state: { urlA: trimmed, urlB: compareUrl.trim() } });
      return;
    }

    navigate("/analyze", { state: { url: trimmed, focus } });
  }

  function addQueue() {
    const trimmed = url.trim();
    if (!isValidGitHubUrl(trimmed)) return setError("Must be a valid GitHub URL");
    addToQueue(trimmed, { focus });
    setError("");
    setUrl("");
  }

  const features = [
    { icon: BarChart3, title: "Skill Radar", desc: "5-dimension engineering scores", color: "text-accent" },
    { icon: Zap, title: "AI Suggestions", desc: "Before/after code improvements", color: "text-green" },
    { icon: GitCompare, title: "Compare Mode", desc: "Side-by-side repo comparison", color: "text-purple" },
    { icon: Shield, title: "Security Scan", desc: "Dependency & README analysis", color: "text-orange" },
    { icon: Layers, title: "File Breakdown", desc: "Per-file issue mapping", color: "text-accent" },
    { icon: BookOpen, title: "Learning Roadmap", desc: "Personalized skill gaps", color: "text-green" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen grid-bg relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <AppNav />

      <main className="relative z-10 max-w-4xl mx-auto px-8 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 bg-green rounded-full pulse-dot" />
          <span className="text-xs font-code text-muted">Powered by Gemini AI · v2 Production</span>
        </div>

        <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-5">
          Your code, <span className="gradient-text text-glow">reviewed</span> by AI.
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Paste a GitHub repo, PR, or branch URL. Get scores, file breakdowns, dependency health, PDF reports, and more.
        </p>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              placeholder="https://github.com/user/repo or .../pull/42"
              className="flex-1 bg-surface border border-border text-text placeholder-muted rounded-lg px-4 py-4 font-code text-sm focus:outline-none focus:border-accent transition-all"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="bg-accent hover:bg-accentDim text-bg font-display font-bold px-8 py-4 rounded-lg flex items-center gap-2 justify-center whitespace-nowrap"
            >
              Analyze <ArrowRight size={18} />
            </motion.button>
          </div>

          {showCompare && (
            <input
              type="text"
              value={compareUrl}
              onChange={(e) => setCompareUrl(e.target.value)}
              placeholder="Second repo URL to compare"
              className="w-full bg-surface border border-border text-text placeholder-muted rounded-lg px-4 py-3 font-code text-sm focus:outline-none focus:border-accent"
            />
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFocus(opt.id)}
                className={`text-xs font-code px-3 py-1.5 rounded-full border transition-colors ${
                  focus === opt.id
                    ? "bg-accent/10 text-accent border-accent/40"
                    : "text-muted border-border hover:border-accent/20"
                }`}
                title={opt.desc}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <button type="button" onClick={() => setShowCompare(!showCompare)} className="text-xs font-code text-muted hover:text-accent flex items-center gap-1">
              <GitCompare size={12} /> {showCompare ? "Hide compare" : "Compare two repos"}
            </button>
            <button type="button" onClick={addQueue} className="text-xs font-code text-muted hover:text-accent flex items-center gap-1">
              <ListPlus size={12} /> Add to queue
            </button>
          </div>
        </form>

        {error && <p className="text-red text-sm font-code mb-4">{error}</p>}

        <div className="mb-12">
          <p className="text-muted text-xs font-code mb-3">Sample repositories</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
            {SAMPLE_REPOS.map((repo) => (
              <button
                key={repo.url}
                onClick={() => setUrl(repo.url)}
                className="glass rounded-lg px-4 py-3 text-left hover:border-accent/30 transition-all group"
              >
                <p className="text-accent text-xs font-code group-hover:underline">{repo.label}</p>
                <p className="text-muted text-[10px] font-code">{repo.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </main>

      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass rounded-xl p-5 hover:border-accent/30 transition-all"
            >
              <f.icon className={`${f.color} mb-2`} size={22} />
              <h3 className="font-display text-white text-sm font-bold mb-1">{f.title}</h3>
              <p className="text-muted text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
