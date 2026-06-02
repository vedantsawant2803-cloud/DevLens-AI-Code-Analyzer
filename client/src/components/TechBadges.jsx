export default function TechBadges({ badges }) {
  if (!badges?.length) return <p className="text-muted text-sm font-code">No tech stack detected</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <div
          key={b.key}
          className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2"
          title={`${b.name} — ${b.maturity}`}
        >
          <span className="text-lg">{b.icon}</span>
          <div>
            <p className="text-text text-xs font-code font-bold">{b.name}</p>
            <p className="text-muted text-[10px] font-code capitalize">{b.maturity}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
