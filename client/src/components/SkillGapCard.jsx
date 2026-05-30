import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const LEVEL_CONFIG = {
  Beginner: { color: "text-red", bg: "bg-red/10 border-red/20", bar: "bg-red", width: "w-1/3" },
  Intermediate: { color: "text-orange", bg: "bg-orange/10 border-orange/20", bar: "bg-orange", width: "w-2/3" },
  Advanced: { color: "text-green", bg: "bg-green/10 border-green/20", bar: "bg-green", width: "w-full" },
};

export default function SkillGapCard({ gap, index }) {
  const config = LEVEL_CONFIG[gap.currentLevel] || LEVEL_CONFIG.Intermediate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1 }}
      className="glass rounded-xl p-5 hover:border-accent/20 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-display text-white font-bold text-sm">{gap.skill}</h3>
        <span className={`text-xs font-code border px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
          {gap.currentLevel}
        </span>
      </div>

      {/* Level bar */}
      <div className="h-1.5 bg-border rounded-full mb-4 overflow-hidden">
        <motion.div
          className={`h-full ${config.bar} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: config.width.replace("w-", "") === "full" ? "100%" : config.width.replace("w-", "").replace("/", "/") }}
          transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
          style={{
            width: gap.currentLevel === "Beginner" ? "33%" : gap.currentLevel === "Intermediate" ? "66%" : "100%"
          }}
        />
      </div>

      <div className="flex items-start gap-2">
        <TrendingUp size={14} className="text-accent mt-0.5 flex-shrink-0" />
        <p className="text-muted text-xs leading-relaxed">{gap.recommendation}</p>
      </div>
    </motion.div>
  );
}
