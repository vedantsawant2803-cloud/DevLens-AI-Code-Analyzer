import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAnalysis } from "../context/AnalysisContext";
import AppNav from "../components/AppNav";
import RadarChart from "../components/RadarChart";
import ScoreCard from "../components/ScoreCard";
import ImprovementCard from "../components/ImprovementCard";
import SkillGapCard from "../components/SkillGapCard";
import ShareCard from "../components/ShareCard";
import FileBreakdown from "../components/FileBreakdown";
import FixItPrompt from "../components/FixItPrompt";
import TechBadges from "../components/TechBadges";
import DependencyHealth from "../components/DependencyHealth";
import ReadmeScore from "../components/ReadmeScore";
import CommitInsight from "../components/CommitInsight";
import BadgePanel from "../components/BadgePanel";
import PdfExport from "../components/PdfExport";
import TrendChart from "../components/TrendChart";
import { Share2, Github } from "lucide-react";

export default function ResultsPage() {
  const { analysisData, repoInfo, insights, history } = useAnalysis();
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!analysisData) navigate("/");
  }, []);

  if (!analysisData) return null;

  const { scores, overallScore, level, summary, strengths, improvements, skillGaps, techStack, fileBreakdown, fixItPrompt } = analysisData;

  const scoreColor = overallScore >= 75 ? "text-green" : overallScore >= 50 ? "text-orange" : "text-red";
  const levelColors = {
    Beginner: "bg-red/20 text-red border-red/30",
    Intermediate: "bg-orange/20 text-orange border-orange/30",
    Advanced: "bg-green/20 text-green border-green/30",
    Expert: "bg-purple/20 text-purple border-purple/30",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen grid-bg">
      <AppNav />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            {repoInfo && (
              <a href={repoInfo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted hover:text-text text-sm font-code mb-1">
                <Github size={14} /> {repoInfo.owner}/{repoInfo.name}
              </a>
            )}
            <h1 className="font-display text-white text-2xl font-bold">Analysis Results</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <PdfExport analysis={analysisData} repoInfo={repoInfo} insights={insights} />
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 bg-accent text-bg font-display font-bold text-sm px-4 py-2 rounded-lg hover:bg-accentDim"
            >
              <Share2 size={14} /> Share PNG
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-8 flex flex-col items-center text-center">
            {repoInfo?.avatar && <img src={repoInfo.avatar} alt="" className="w-12 h-12 rounded-full border border-border mb-4" />}
            <p className="text-muted text-xs font-code mb-2">OVERALL SCORE</p>
            <div className={`font-display text-8xl font-bold ${scoreColor}`} style={{ lineHeight: 1 }}>{overallScore}</div>
            <span className={`text-xs font-code border px-3 py-1 rounded-full mt-3 ${levelColors[level] || levelColors.Intermediate}`}>{level}</span>
            {techStack?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1 justify-center">
                {techStack.map((t) => (
                  <span key={t} className="text-xs font-code bg-surface border border-border text-muted px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="glass rounded-2xl p-6">
              <p className="text-muted text-xs font-code mb-2 uppercase">AI Summary</p>
              <p className="text-text leading-relaxed">{summary}</p>
            </div>
            <div className="glass rounded-2xl p-6">
              <p className="text-muted text-xs font-code mb-3 uppercase">Strengths</p>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm"><span className="text-green">✓</span><span>{s}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Insights row */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-2xl p-5"><ReadmeScore data={insights.readmeScore} /></div>
            <div className="glass rounded-2xl p-5"><CommitInsight data={insights.commitActivity} /></div>
            <div className="glass rounded-2xl p-5 lg:col-span-2"><TechBadges badges={insights.techBadges} /></div>
          </div>
        )}

        {/* Scores + Radar + Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <p className="text-muted text-xs font-code mb-4 uppercase">Score Breakdown</p>
            <div className="space-y-4">
              {Object.entries(scores).map(([key, val], i) => (
                <ScoreCard key={key} label={key} value={val} index={i} />
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-6 flex flex-col">
            <p className="text-muted text-xs font-code mb-4 uppercase">Skill Radar</p>
            <div className="flex-1 flex items-center justify-center"><RadarChart scores={scores} /></div>
          </div>
          <div className="glass rounded-2xl p-6">
            <p className="text-muted text-xs font-code mb-4 uppercase">Score Trend</p>
            <TrendChart history={history} repoUrl={repoInfo?.url} />
          </div>
        </div>

        {/* File breakdown */}
        {fileBreakdown?.length > 0 && (
          <div className="mb-8">
            <p className="text-muted text-xs font-code mb-4 uppercase">File-Level Breakdown</p>
            <FileBreakdown files={fileBreakdown} />
          </div>
        )}

        {/* Fix-it prompt */}
        <div className="mb-8"><FixItPrompt prompt={fixItPrompt} /></div>

        {/* Dependencies */}
        {insights?.dependencies && (
          <div className="glass rounded-2xl p-6 mb-8">
            <p className="text-muted text-xs font-code mb-4 uppercase">Dependency Health</p>
            <DependencyHealth data={insights.dependencies} />
          </div>
        )}

        {/* Improvements */}
        <div className="mb-8">
          <p className="text-muted text-xs font-code mb-4 uppercase">Code Improvements</p>
          <div className="space-y-4">
            {improvements.map((item, i) => <ImprovementCard key={i} item={item} index={i} />)}
          </div>
        </div>

        {/* Skill gaps + Badge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <p className="text-muted text-xs font-code mb-4 uppercase">Skill Gap Roadmap</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {skillGaps.map((gap, i) => <SkillGapCard key={i} gap={gap} index={i} />)}
            </div>
          </div>
          <BadgePanel owner={repoInfo?.owner} repo={repoInfo?.name} score={overallScore} />
        </div>

        <div className="glass rounded-2xl p-8 text-center">
          <button onClick={() => navigate("/")} className="bg-accent text-bg font-display font-bold px-8 py-3 rounded-lg hover:bg-accentDim">
            Analyze Another Repo
          </button>
        </div>
      </div>

      {showShare && <ShareCard analysis={analysisData} repoInfo={repoInfo} onClose={() => setShowShare(false)} />}
    </motion.div>
  );
}
