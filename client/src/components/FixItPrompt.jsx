import { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";

export default function FixItPrompt({ prompt }) {
  const [copied, setCopied] = useState(false);
  if (!prompt) return null;

  function copy() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-purple" size={18} />
          <p className="text-muted text-xs font-code uppercase tracking-widest">Fix-It Prompt for Cursor / Copilot</p>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs font-code bg-surface border border-border px-3 py-1.5 rounded-lg hover:border-accent/30 transition-colors"
        >
          {copied ? <Check size={12} className="text-green" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="text-text text-sm font-code leading-relaxed bg-surface border border-border rounded-lg p-4">
        {prompt}
      </p>
    </div>
  );
}
