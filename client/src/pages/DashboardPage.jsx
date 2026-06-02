import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { History, TrendingUp, ArrowRight } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import AppNav from "../components/AppNav";
import TrendChart from "../components/TrendChart";

export default function DashboardPage() {
  const { history } = useAnalysis();
  const navigate = useNavigate();

  const avgScore = history.length
    ? Math.round(history.reduce((s, h) => s + h.overallScore, 0) / history.length)
    : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen grid-bg">
      <AppNav />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-white text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted text-sm font-code">Track your analysis history and score trends</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-muted text-xs font-code mb-1">TOTAL ANALYSES</p>
            <p className="font-display text-4xl font-bold text-accent">{history.length}</p>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-muted text-xs font-code mb-1">AVERAGE SCORE</p>
            <p className="font-display text-4xl font-bold text-green">{avgScore || "—"}</p>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-muted text-xs font-code mb-1">UNIQUE REPOS</p>
            <p className="font-display text-4xl font-bold text-purple">
              {new Set(history.map((h) => h.repoUrl)).size}
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-accent" size={18} />
            <p className="text-muted text-xs font-code uppercase tracking-widest">Score Trend</p>
          </div>
          <TrendChart history={history} />
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="text-accent" size={18} />
            <p className="text-muted text-xs font-code uppercase tracking-widest">Recent Analyses</p>
          </div>
          {history.length === 0 ? (
            <p className="text-muted text-sm font-code text-center py-8">No analyses yet. Analyze a repo to get started.</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 15).map((h) => (
                <div
                  key={h.timestamp + h.repoUrl}
                  className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3 hover:border-accent/20 transition-colors"
                >
                  <div>
                    <p className="text-text text-sm font-code font-bold">{h.repoName}</p>
                    <p className="text-muted text-xs font-code">{new Date(h.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display text-xl font-bold text-accent">{h.overallScore}</span>
                    <span className="text-xs font-code text-muted border border-border px-2 py-0.5 rounded">{h.level}</span>
                    <button
                      onClick={() => navigate("/analyze", { state: { url: h.repoUrl, focus: h.focus } })}
                      className="text-accent hover:text-accentDim transition-colors"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
