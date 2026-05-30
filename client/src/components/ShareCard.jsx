import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Download, Copy, Check } from "lucide-react";
import html2canvas from "html2canvas";

export default function ShareCard({ analysis, repoInfo, onClose }) {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { overallScore, level, scores, techStack } = analysis;

  const scoreColor = overallScore >= 75 ? "#00ff9d" : overallScore >= 50 ? "#ff9500" : "#ff3b5c";

  async function downloadCard() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#080c14",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `devlens-${repoInfo?.name || "report"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
    setExporting(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const scoreLabels = {
    cleanCode: "Clean Code",
    performance: "Perf",
    security: "Security",
    scalability: "Scale",
    documentation: "Docs",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(8, 12, 20, 0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-lg w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-white font-bold">Share your report card</h3>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* The actual card that gets exported */}
        <div
          ref={cardRef}
          className="rounded-2xl p-8 mb-4 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0d1422 0%, #080c14 100%)",
            border: "1px solid #1a2540",
          }}
        >
          {/* Grid bg on card */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "linear-gradient(#1a2540 1px, transparent 1px), linear-gradient(90deg, #1a2540 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="font-display text-white font-bold text-lg">DevLens</span>
                <span className="text-xs font-code text-muted bg-surface border border-border px-2 py-0.5 rounded">Code Review</span>
              </div>
              <span className="text-xs font-code text-muted">{new Date().toLocaleDateString()}</span>
            </div>

            {/* Repo name */}
            {repoInfo && (
              <div className="flex items-center gap-3 mb-6">
                {repoInfo.avatar && (
                  <img src={repoInfo.avatar} alt="" className="w-10 h-10 rounded-full border border-border" />
                )}
                <div>
                  <p className="text-white font-bold font-display">{repoInfo.owner}/{repoInfo.name}</p>
                  {repoInfo.language && (
                    <p className="text-muted text-xs font-code">{repoInfo.language}</p>
                  )}
                </div>
              </div>
            )}

            {/* Big score */}
            <div className="text-center mb-6">
              <div className="font-display font-bold" style={{ fontSize: "80px", color: scoreColor, lineHeight: 1 }}>
                {overallScore}
              </div>
              <p className="text-muted text-sm font-code mt-1">Overall Score · {level}</p>
            </div>

            {/* Mini score bars */}
            <div className="space-y-2">
              {Object.entries(scores).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-muted text-xs font-code w-20 text-right">{scoreLabels[key]}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: "#1a2540" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${val}%`,
                        background: val >= 75 ? "#00ff9d" : val >= 50 ? "#ff9500" : "#ff3b5c",
                      }}
                    />
                  </div>
                  <span className="text-white text-xs font-code w-6">{val}</span>
                </div>
              ))}
            </div>

            {/* Tech stack */}
            {techStack && techStack.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {techStack.map((t) => (
                  <span key={t} className="text-xs font-code text-muted px-2 py-0.5 rounded border" style={{ borderColor: "#1a2540", background: "#0d1422" }}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Watermark */}
            <p className="text-right text-xs font-code mt-5" style={{ color: "#1a2540" }}>
              devlens.app
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={downloadCard}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 bg-accent text-bg font-display font-bold py-3 rounded-lg hover:bg-accentDim transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            {exporting ? "Exporting..." : "Download PNG"}
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-surface border border-border text-text font-code text-sm px-4 py-3 rounded-lg hover:border-accent/30 transition-colors"
          >
            {copied ? <Check size={16} className="text-green" /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
