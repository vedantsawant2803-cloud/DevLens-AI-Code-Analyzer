import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Zap, BarChart3, BookOpen, Github, ArrowRight, Terminal } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";

const SAMPLE_REPOS = [
  "https://github.com/facebook/react",
  "https://github.com/expressjs/express",
  "https://github.com/vercel/next.js",
];

export default function LandingPage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setRepoInfo } = useAnalysis();

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return setError("Please enter a GitHub repository URL");
    if (!trimmed.includes("github.com")) return setError("Must be a GitHub URL (e.g. https://github.com/user/repo)");
    setError("");
    navigate("/analyze", { state: { url: trimmed } });
  }

  const features = [
    { icon: BarChart3, title: "Skill Radar", desc: "Visual scores across 5 engineering dimensions", color: "text-accent" },
    { icon: Zap, title: "AI Suggestions", desc: "Before/after code improvements from Claude AI", color: "text-green" },
    { icon: BookOpen, title: "Learning Roadmap", desc: "Personalized gaps & resources to level up", color: "text-purple" },
    { icon: Search, title: "Deep Analysis", desc: "Fetches & reviews all your actual source files", color: "text-orange" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen grid-bg relative overflow-hidden"
    >
      {/* Radial glow behind hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-purple/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Terminal className="text-accent" size={20} />
          <span className="font-display text-white font-bold tracking-wider">DevLens</span>
          <span className="text-xs text-muted font-code bg-surface border border-border px-2 py-0.5 rounded">beta</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm"
        >
          <Github size={16} />
          <span className="font-code">GitHub</span>
        </a>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-4xl mx-auto px-8 pt-20 pb-32 text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-green rounded-full pulse-dot" />
            <span className="text-xs font-code text-muted">Powered by Claude AI</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
        >
          Your code,{" "}
          <span className="gradient-text text-glow">reviewed</span>
          <br />
          by a senior engineer.
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Paste any public GitHub repo URL. Get an instant AI-powered code review,
          skill gap analysis, and personalized learning roadmap.
        </motion.p>

        {/* Input form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-4"
        >
          <div className="flex-1 relative">
            <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              placeholder="https://github.com/username/repo"
              className="w-full bg-surface border border-border text-text placeholder-muted rounded-lg pl-11 pr-4 py-4 font-code text-sm focus:outline-none focus:border-accent focus:glow-accent transition-all"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="bg-accent hover:bg-accentDim text-bg font-display font-bold px-8 py-4 rounded-lg flex items-center gap-2 justify-center whitespace-nowrap transition-colors"
          >
            Analyze <ArrowRight size={18} />
          </motion.button>
        </motion.form>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red text-sm font-code mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* Sample repos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          <span className="text-muted text-xs font-code">try:</span>
          {SAMPLE_REPOS.map((repo) => (
            <button
              key={repo}
              onClick={() => setUrl(repo)}
              className="text-xs font-code text-accent/70 hover:text-accent underline underline-offset-2 transition-colors"
            >
              {repo.replace("https://github.com/", "")}
            </button>
          ))}
        </motion.div>
      </main>

      {/* Features grid */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass rounded-xl p-6 hover:border-accent/30 transition-all group"
            >
              <f.icon className={`${f.color} mb-3 group-hover:scale-110 transition-transform`} size={24} />
              <h3 className="font-display text-white text-sm font-bold mb-1">{f.title}</h3>
              <p className="text-muted text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-8 text-muted text-xs font-code">
        Built with React + Claude AI · Open Source
      </footer>
    </motion.div>
  );
}
