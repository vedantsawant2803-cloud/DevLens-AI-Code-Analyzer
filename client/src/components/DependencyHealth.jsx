import { Package, AlertCircle, CheckCircle } from "lucide-react";

export default function DependencyHealth({ data }) {
  if (!data || !data.dependencies?.length) {
    return (
      <div className="text-muted text-sm font-code flex items-center gap-2">
        <Package size={16} /> {data?.notes || "No dependency manifest found"}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Package className="text-accent" size={18} />
        <div>
          <p className="text-text text-sm font-code font-bold">{data.manifest}</p>
          <p className="text-muted text-xs font-code">{data.count} dependencies · {data.type}</p>
        </div>
      </div>
      <p className="text-muted text-xs font-code mb-3">{data.notes}</p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {data.dependencies.slice(0, 12).map((dep) => (
          <div key={dep.name} className="flex items-center justify-between text-xs font-code bg-surface rounded px-3 py-1.5">
            <span className="text-text">{dep.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted">{dep.version}</span>
              {dep.status === "risky" ? (
                <AlertCircle size={12} className="text-orange" />
              ) : (
                <CheckCircle size={12} className="text-green" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
