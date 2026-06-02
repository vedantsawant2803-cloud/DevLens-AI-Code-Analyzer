import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TrendChart({ history, repoUrl }) {
  const filtered = (repoUrl
    ? history.filter((h) => h.repoUrl === repoUrl)
    : history
  )
    .slice(0, 20)
    .reverse()
    .map((h, i) => ({
      name: new Date(h.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: h.overallScore,
      idx: i,
    }));

  if (filtered.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-sm font-code">
        Analyze the same repo twice to see score trends
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={filtered}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--text)" }}
        />
        <Line type="monotone" dataKey="score" stroke="#00e5ff" strokeWidth={2} dot={{ fill: "#00e5ff", r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
