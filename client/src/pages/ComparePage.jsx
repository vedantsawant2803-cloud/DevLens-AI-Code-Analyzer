import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { GitCompare, Loader2 } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import AppNav from "../components/AppNav";
import CompareRadar from "../components/CompareRadar";
import { runFullAnalysis } from "../utils/api";

export default function ComparePage() {
  const location = useLocation();
  const { history, setCompareData } = useAnalysis();
  const navigate = useNavigate();
  const [urlA, setUrlA] = useState(location.state?.urlA || "");
  const [urlB, setUrlB] = useState(location.state?.urlB || "");
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runCompare(e) {
    e?.preventDefault?.();
    if (!urlA.trim() || !urlB.trim()) return setError("Enter both repository URLs");
    setLoading(true);
    setError("");
    try {
      const [a, b] = await Promise.all([
        runFullAnalysis(urlA.trim()),
        runFullAnalysis(urlB.trim()),
      ]);
      setResultA(a);
      setResultB(b);
      setCompareData({ a, b });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (location.state?.urlA && location.state?.urlB && !resultA) {
      runCompare({ preventDefault: () => {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function compareFromHistory(entryA, entryB) {
    if (!entryA || !entryB) return;
    setResultA({ analysis: entryA.scores ? { scores: entryA.scores, overallScore: entryA.overallScore } : entryA, info: { name: entryA.repoName } });
    setResultB({ analysis: entryB.scores ? { scores: entryB.scores, overallScore: entryB.overallScore } : entryB, info: { name: entryB.repoName } });
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen grid-bg">
      <AppNav />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-display text-white text-3xl font-bold mb-2">Compare Repositories</h1>
        <p className="text-muted text-sm font-code mb-8">Side-by-side AI score comparison</p>

        <form onSubmit={runCompare} className="glass rounded-2xl p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={urlA}
              onChange={(e) => setUrlA(e.target.value)}
              placeholder="Repository A URL"
              className="bg-surface border border-border rounded-lg px-4 py-3 font-code text-sm text-text focus:outline-none focus:border-accent"
            />
            <input
              value={urlB}
              onChange={(e) => setUrlB(e.target.value)}
              placeholder="Repository B URL"
              className="bg-surface border border-border rounded-lg px-4 py-3 font-code text-sm text-text focus:outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-red text-xs font-code">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-accent text-bg font-display font-bold px-6 py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <GitCompare size={16} />}
            {loading ? "Analyzing both repos..." : "Compare"}
          </button>
        </form>

        {history.length >= 2 && !resultA && (
          <div className="glass rounded-2xl p-6 mb-8">
            <p className="text-muted text-xs font-code mb-3">Quick compare from history:</p>
            <button
              onClick={() => compareFromHistory(history[0], history[1])}
              className="text-accent text-sm font-code hover:underline"
            >
              {history[0].repoName} vs {history[1].repoName}
            </button>
          </div>
        )}

        {resultA && resultB && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-muted text-xs font-code mb-2">REPO A</p>
              <p className="text-text font-code text-sm mb-2 truncate">{resultA.info?.name || urlA}</p>
              <p className="font-display text-6xl font-bold text-accent">{resultA.analysis?.overallScore}</p>
            </div>
            <div className="glass rounded-2xl p-6 lg:col-span-1">
              <CompareRadar
                left={resultA.analysis}
                right={resultB.analysis}
                leftLabel={resultA.info?.name || "A"}
                rightLabel={resultB.info?.name || "B"}
              />
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-muted text-xs font-code mb-2">REPO B</p>
              <p className="text-text font-code text-sm mb-2 truncate">{resultB.info?.name || urlB}</p>
              <p className="font-display text-6xl font-bold text-green">{resultB.analysis?.overallScore}</p>
            </div>
          </div>
        )}

        {resultA && (
          <button
            onClick={() => navigate("/results")}
            className="mt-8 text-muted text-sm font-code hover:text-accent transition-colors"
          >
            View last single-repo results →
          </button>
        )}
      </div>
    </motion.div>
  );
}
