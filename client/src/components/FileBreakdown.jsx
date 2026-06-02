import { motion } from "framer-motion";
import { FileCode, AlertTriangle } from "lucide-react";

export default function FileBreakdown({ files }) {
  if (!files?.length) return null;

  const scoreColor = (s) => (s >= 75 ? "text-green" : s >= 50 ? "text-orange" : "text-red");

  return (
    <div className="space-y-3">
      {files.map((f, i) => (
        <motion.div
          key={f.file}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass rounded-xl p-4 flex items-start gap-4"
        >
          <FileCode className="text-accent shrink-0 mt-0.5" size={18} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-code text-sm text-text truncate">{f.file}</span>
              <span className={`font-display font-bold text-lg ${scoreColor(f.score)}`}>{f.score}</span>
            </div>
            <p className="text-muted text-xs flex items-start gap-1">
              <AlertTriangle size={12} className="shrink-0 mt-0.5 text-orange" />
              {f.topIssue}
            </p>
            {f.dimensions && (
              <div className="flex gap-3 mt-2">
                {Object.entries(f.dimensions).map(([k, v]) => (
                  <span key={k} className="text-[10px] font-code text-muted">
                    {k}: <span className={scoreColor(v)}>{v}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
