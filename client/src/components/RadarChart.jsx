import {
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const LABELS = {
  cleanCode: "Clean Code",
  performance: "Performance",
  security: "Security",
  scalability: "Scalability",
  documentation: "Docs",
};

export default function RadarChart({ scores }) {
  const data = Object.entries(scores).map(([key, value]) => ({
    subject: LABELS[key] || key,
    value,
    fullMark: 100,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg px-3 py-2 text-xs font-code border border-accent/30">
          <p className="text-accent">{payload[0].payload.subject}</p>
          <p className="text-white">{payload[0].value}/100</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ReRadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#1a2540" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#4a5980", fontSize: 11, fontFamily: "'Space Mono', monospace" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#00e5ff"
          fill="#00e5ff"
          fillOpacity={0.12}
          strokeWidth={2}
          dot={{ r: 3, fill: "#00e5ff", strokeWidth: 0 }}
        />
      </ReRadarChart>
    </ResponsiveContainer>
  );
}
