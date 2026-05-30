import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAnalysis } from "../context/AnalysisContext";
import RadarChart from "../components/RadarChart";
import ScoreCard from "../components/ScoreCard";
import ImprovementCard from "../components/ImprovementCard";
import SkillGapCard from "../components/SkillGapCard";
import ShareCard from "../components/ShareCard";
import { Terminal, ArrowLeft, Download, Share2, Github } from "lucide-react";

export default function ResultsPage() {
  const { analysisData, repoInfo } = useAnalysis();
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!analysisData) navigate("/");
  }, []);

  if (!analysisData) return null;

  const { scores, overallScore, level, summary, strengths, improvements, skillGaps, techStack } = analysisData;

  const scoreColor = overallScore >= 75 ? "text-green" : overallScore >= 50 ? "text-orange" : "text-red";
  const levelColors = {
    Beginner: "bg-red/20 text-red border-red/30",
    Intermediate: "bg-orange/20 text-orange border-orange/30",
    Advanced: "bg-green/20 text-green border-green/30",
    Expert: "bg-purple/20 text-purple border-purple/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen grid-bg"
    >
      {/* Ambient glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-accent/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-purple/3 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm font-code"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="w-px h-5 bg-border" />
            <Terminal className="text-accent" size={18} />
            <span className="font-display text-white font-bold">DevLens</span>
          </div>

          <div className="flex items-center gap-3">
            {repoInfo && (
              <a
                href={repoInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted hover:text-text text-sm font-code transition-colors"
              >
                <Github size={14} />
                {repoInfo.owner}/{repoInfo.name}
              </a>
            )}
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 bg-accent text-bg font-display font-bold text-sm px-4 py-2 rounded-lg hover:bg-accentDim transition-colors"
            >
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero score section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Overall score */}
          <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center col-span-1">
            {repoInfo?.avatar && (
              <img src={repoInfo.avatar} alt="repo owner" className="w-12 h-12 rounded-full border border-border mb-4" />
            )}
            <p className="text-muted text-xs font-code mb-3">OVERALL SCORE</p>
            <div className={`font-display text-8xl font-bold ${scoreColor} mb-2`} style={{ lineHeight: 1 }}>
              {overallScore}
            </div>
            <div className="text-muted text-sm font-code mb-4">/ 100</div>
            <span className={`text-xs font-code border px-3 py-1 rounded-full ${levelColors[level] || levelColors.Intermediate}`}>
              {level}
            </span>
            {techStack && techStack.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1 justify-center">
                {techStack.map((t) => (
                  <span key={t} className="text-xs font-code bg-surface border border-border text-muted px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Summary + strengths */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass rounded-2xl p-6">
              <p className="text-muted text-xs font-code mb-2 uppercase tracking-widest">AI Summary</p>
              <p className="text-text leading-relaxed">{summary}</p>
            </div>
            <div className="glass rounded-2xl p-6">
              <p className="text-muted text-xs font-code mb-3 uppercase tracking-widest">Strengths</p>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green mt-0.5">✓</span>
                    <span className="text-text">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Score breakdown + Radar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Score bars */}
          <div className="glass rounded-2xl p-6">
            <p className="text-muted text-xs font-code mb-5 uppercase tracking-widest">Score Breakdown</p>
            <div className="space-y-4">
              {Object.entries(scores).map(([key, val], i) => (
                <ScoreCard key={key} label={key} value={val} index={i} />
              ))}
            </div>
          </div>

          {/* Radar chart */}
          <div className="glass rounded-2xl p-6 flex flex-col">
            <p className="text-muted text-xs font-code mb-4 uppercase tracking-widest">Skill Radar</p>
            <div className="flex-1 flex items-center justify-center">
              <RadarChart scores={scores} />
            </div>
          </div>
        </motion.div>

        {/* Code improvements */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <p className="text-muted text-xs font-code mb-4 uppercase tracking-widest">Code Improvements</p>
          <div className="space-y-4">
            {improvements.map((item, i) => (
              <ImprovementCard key={i} item={item} index={i} />
            ))}
          </div>
        </motion.div>

        {/* Skill gaps */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <p className="text-muted text-xs font-code mb-4 uppercase tracking-widest">Skill Gap Roadmap</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {skillGaps.map((gap, i) => (
              <SkillGapCard key={i} gap={gap} index={i} />
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-8 text-center"
        >
          <p className="text-muted text-xs font-code mb-2">READY TO LEVEL UP?</p>
          <h3 className="font-display text-white text-2xl font-bold mb-3">
            Analyze another repository
          </h3>
          <p className="text-muted text-sm mb-6">Track your progress over time by analyzing your repos regularly.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-accent text-bg font-display font-bold px-8 py-3 rounded-lg hover:bg-accentDim transition-colors"
          >
            Analyze New Repo
          </button>
        </motion.div>
      </div>

      {/* Share modal */}
      {showShare && (
        <ShareCard
          analysis={analysisData}
          repoInfo={repoInfo}
          onClose={() => setShowShare(false)}
        />
      )}
    </motion.div>
  );
}
