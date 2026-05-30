import { motion } from "framer-motion";

const LABELS = {
  cleanCode: "Clean Code",
  performance: "Performance",
  security: "Security",
  scalability: "Scalability",
  documentation: "Documentation",
};

function getBarColor(value) {
  if (value >= 75) return "from-green to-green/70";
  if (value >= 50) return "from-orange to-orange/70";
  return "from-red to-red/70";
}

function getTextColor(value) {
  if (value >= 75) return "text-green";
  if (value >= 50) return "text-orange";
  return "text-red";
}

export default function ScoreCard({ label, value, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-text font-code">{LABELS[label] || label}</span>
        <span className={`text-sm font-display font-bold ${getTextColor(value)}`}>{value}</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${getBarColor(value)} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.2 + index * 0.1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
