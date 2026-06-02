import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ListOrdered, Play, Trash2, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import AppNav from "../components/AppNav";
import { runFullAnalysis } from "../utils/api";

export default function QueuePage() {
  const { queue, updateQueueItem, removeFromQueue, clearQueue, setAnalysisData, setRepoInfo, setInsights, saveToHistory } = useAnalysis();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);

  async function processQueue() {
    setRunning(true);
    for (const item of queue.filter((q) => q.status === "pending")) {
      updateQueueItem(item.id, { status: "running" });
      try {
        const result = await runFullAnalysis(item.url, { focus: item.focus });
        updateQueueItem(item.id, { status: "done", score: result.analysis.overallScore });
        setAnalysisData(result.analysis);
        setRepoInfo(result.info);
        setInsights(result.insights);
        saveToHistory({
          repoName: result.info.name,
          repoUrl: item.url,
          overallScore: result.analysis.overallScore,
          level: result.analysis.level,
          scores: result.analysis.scores,
          focus: item.focus,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        updateQueueItem(item.id, { status: "failed", error: err.message });
      }
    }
    setRunning(false);
  }

  const statusIcon = {
    pending: null,
    running: <Loader2 size={14} className="animate-spin text-accent" />,
    done: <CheckCircle size={14} className="text-green" />,
    failed: <AlertCircle size={14} className="text-red" />,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen grid-bg">
      <AppNav />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-white text-3xl font-bold mb-2">Analysis Queue</h1>
            <p className="text-muted text-sm font-code">Batch analyze multiple repositories</p>
          </div>
          <div className="flex gap-2">
            {queue.some((q) => q.status === "pending") && (
              <button
                onClick={processQueue}
                disabled={running}
                className="flex items-center gap-2 bg-accent text-bg font-display font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                <Play size={14} /> {running ? "Running..." : "Run Queue"}
              </button>
            )}
            {queue.length > 0 && (
              <button onClick={clearQueue} className="flex items-center gap-2 text-red text-sm font-code border border-red/30 px-4 py-2 rounded-lg hover:bg-red/10">
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <ListOrdered className="text-muted mx-auto mb-4" size={48} />
            <p className="text-muted font-code text-sm">Queue is empty. Add repos from the Analyze page.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <div key={item.id} className="glass rounded-xl p-4 flex items-center gap-4">
                {statusIcon[item.status]}
                <div className="flex-1 min-w-0">
                  <p className="text-text text-sm font-code truncate">{item.url}</p>
                  <p className="text-muted text-xs font-code capitalize">{item.focus} · {item.status}{item.score != null ? ` · ${item.score}/100` : ""}</p>
                  {item.error && <p className="text-red text-xs font-code">{item.error}</p>}
                </div>
                <button onClick={() => removeFromQueue(item.id)} className="text-muted hover:text-red transition-colors">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {queue.some((q) => q.status === "done") && (
          <button
            onClick={() => navigate("/results")}
            className="mt-6 bg-surface border border-border text-text font-code text-sm px-6 py-3 rounded-lg hover:border-accent/30"
          >
            View last results →
          </button>
        )}
      </div>
    </motion.div>
  );
}
