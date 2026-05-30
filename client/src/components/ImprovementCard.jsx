import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, Zap, Shield } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const IMPACT_CONFIG = {
  High: { color: "text-red border-red/30 bg-red/10", icon: AlertTriangle },
  Medium: { color: "text-orange border-orange/30 bg-orange/10", icon: Zap },
  Low: { color: "text-green border-green/30 bg-green/10", icon: Shield },
};

export default function ImprovementCard({ item, index }) {
  const [open, setOpen] = useState(index === 0);
  const impact = IMPACT_CONFIG[item.impact] || IMPACT_CONFIG.Medium;
  const ImpactIcon = impact.icon;

  // Detect language from code snippet
  const detectLang = (code) => {
    if (!code) return "javascript";
    if (code.includes("def ") || code.includes("import ") && !code.includes("from ")) return "python";
    if (code.includes("func ") && code.includes("go")) return "go";
    return "javascript";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-surface/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-code border px-2 py-0.5 rounded-full flex items-center gap-1 ${impact.color}`}>
            <ImpactIcon size={10} />
            {item.impact} Impact
          </span>
          <h3 className="font-display text-white font-bold text-sm">{item.title}</h3>
        </div>
        <ChevronDown
          size={18}
          className={`text-muted transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
              <p className="text-muted text-sm leading-relaxed">{item.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red" />
                    <span className="text-xs font-code text-red uppercase tracking-wider">Before</span>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-red/20">
                    <SyntaxHighlighter
                      language={detectLang(item.before)}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: "12px",
                        background: "rgba(255, 59, 92, 0.05)",
                        fontSize: "12px",
                        fontFamily: "'Fira Code', monospace",
                      }}
                    >
                      {item.before || "// No example available"}
                    </SyntaxHighlighter>
                  </div>
                </div>

                {/* After */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green" />
                    <span className="text-xs font-code text-green uppercase tracking-wider">After</span>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-green/20">
                    <SyntaxHighlighter
                      language={detectLang(item.after)}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: "12px",
                        background: "rgba(0, 255, 157, 0.05)",
                        fontSize: "12px",
                        fontFamily: "'Fira Code', monospace",
                      }}
                    >
                      {item.after || "// No example available"}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
