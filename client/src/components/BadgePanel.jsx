import { useState } from "react";
import { Copy, Check, Award } from "lucide-react";

export default function BadgePanel({ owner, repo, score }) {
  const [copied, setCopied] = useState(false);
  if (!owner || !repo) return null;

  const badgeUrl = `${window.location.origin}/api/badge/${owner}/${repo}.svg`;
  const markdown = `[![DevLens Score](${badgeUrl})](https://github.com/${owner}/${repo})`;

  function copy() {
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="text-accent" size={18} />
        <p className="text-muted text-xs font-code uppercase tracking-widest">README Badge</p>
      </div>
      <div className="bg-surface border border-border rounded-lg p-4 mb-4 flex items-center justify-center">
        <img src={badgeUrl} alt={`DevLens score ${score}`} />
      </div>
      <p className="text-muted text-xs font-code mb-2">Add to your README.md:</p>
      <code className="block text-xs font-code text-text bg-surface border border-border rounded p-3 mb-3 break-all">
        {markdown}
      </code>
      <button
        onClick={copy}
        className="flex items-center gap-2 text-xs font-code bg-accent/10 text-accent border border-accent/30 px-3 py-2 rounded-lg hover:bg-accent/20 transition-colors"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied!" : "Copy Markdown"}
      </button>
    </div>
  );
}
