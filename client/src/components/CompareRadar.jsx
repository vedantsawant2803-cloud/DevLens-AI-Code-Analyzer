import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend } from "recharts";

const LABELS = {
  cleanCode: "Clean",
  performance: "Perf",
  security: "Security",
  scalability: "Scale",
  documentation: "Docs",
};

export default function CompareRadar({ left, right, leftLabel, rightLabel }) {
  const keys = Object.keys(left?.scores || left || {});
  const data = keys.map((key) => ({
    subject: LABELS[key] || key,
    [leftLabel]: (left?.scores || left)[key],
    [rightLabel]: (right?.scores || right)[key],
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <Radar name={leftLabel} dataKey={leftLabel} stroke="#00e5ff" fill="#00e5ff" fillOpacity={0.2} />
        <Radar name={rightLabel} dataKey={rightLabel} stroke="#00ff9d" fill="#00ff9d" fillOpacity={0.2} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text)" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
