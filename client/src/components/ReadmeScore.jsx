import { FileText, Check, X } from "lucide-react";

export default function ReadmeScore({ data }) {
  if (!data) return null;

  const color = data.score >= 75 ? "text-green" : data.score >= 50 ? "text-orange" : "text-red";

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <FileText className="text-accent" size={20} />
        <div>
          <p className="text-muted text-xs font-code uppercase">README Quality</p>
          <p className={`font-display text-3xl font-bold ${color}`}>{data.score}<span className="text-muted text-lg">/100</span></p>
        </div>
      </div>
      <div className="space-y-2">
        {data.checks?.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-xs font-code">
            {c.passed ? <Check size={14} className="text-green" /> : <X size={14} className="text-red" />}
            <span className={c.passed ? "text-text" : "text-muted"}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
