import { GitCommit, Activity } from "lucide-react";

const ACTIVITY_COLORS = {
  active: "text-green bg-green/10 border-green/30",
  moderate: "text-accent bg-accent/10 border-accent/30",
  stale: "text-orange bg-orange/10 border-orange/30",
  inactive: "text-red bg-red/10 border-red/30",
  unknown: "text-muted bg-surface border-border",
};

export default function CommitInsight({ data }) {
  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-accent" size={18} />
          <span className="text-text text-sm font-code font-bold">Commit Activity</span>
        </div>
        <span className={`text-xs font-code border px-2 py-0.5 rounded-full capitalize ${ACTIVITY_COLORS[data.activityLevel]}`}>
          {data.activityLevel}
        </span>
      </div>
      {data.daysSincePush != null && (
        <p className="text-muted text-xs font-code mb-3">
          Last push: {data.daysSincePush === 0 ? "today" : `${data.daysSincePush} days ago`}
        </p>
      )}
      <div className="space-y-2">
        {data.recentCommits?.map((c, i) => (
          <div key={i} className="flex items-start gap-2 text-xs font-code">
            <GitCommit size={12} className="text-muted shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-text truncate">{c.message}</p>
              <p className="text-muted">{c.author} · {c.date ? new Date(c.date).toLocaleDateString() : ""}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
