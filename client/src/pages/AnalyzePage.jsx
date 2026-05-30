import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Terminal, GitBranch, Cpu, FileCode, CheckCircle, AlertCircle } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";

const LOADING_STEPS = [
  { icon: GitBranch, label: "Connecting to GitHub API...", key: "github" },
  { icon: FileCode, label: "Fetching source files...", key: "files" },
  { icon: Cpu, label: "Running AI code analysis...", key: "ai" },
  { icon: CheckCircle, label: "Building your report...", key: "report" },
];

const LOG_LINES = [
  "> Initializing DevLens analysis engine...",
  "> Authenticating with GitHub API...",
  "> Scanning repository tree...",
  "> Reading source files (this may take a moment)...",
  "> Sending code to Claude AI for review...",
  "> Calculating skill scores...",
  "> Generating improvement suggestions...",
  "> Building personalized roadmap...",
  "> Finalizing report...",
];

export default function AnalyzePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAnalysisData, setRepoInfo, saveToHistory } = useAnalysis();
  const url = location.state?.url;

  const [currentStep, setCurrentStep] = useState(0);
  const [logLines, setLogLines] = useState([LOG_LINES[0]]);
  const [error, setError] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    if (!url) {
      navigate("/");
      return;
    }
    runAnalysis();
  }, []);

  // Append log lines progressively for that terminal feel
  useEffect(() => {
    if (logLines.length < LOG_LINES.length) {
      const timer = setTimeout(() => {
        setLogLines((prev) => [...prev, LOG_LINES[prev.length]]);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [logLines]);

  // Scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  async function runAnalysis() {
    try {
      // Step 1: Get repo info
      setCurrentStep(0);
      const infoRes = await fetch(`/api/repo/info?url=${encodeURIComponent(url)}`);
      const infoData = await infoRes.json();
      if (!infoRes.ok) throw new Error(infoData.error || "Failed to fetch repo info");
      setRepoInfo(infoData);

      // Step 2: Fetch files
      setCurrentStep(1);
      const filesRes = await fetch("/api/repo/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const filesData = await filesRes.json();
      if (!filesRes.ok) throw new Error(filesData.error || "Failed to fetch files");

      // Step 3: Analyze with AI
      setCurrentStep(2);
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesData.files, repoName: filesData.repo }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error || "Analysis failed");

      // Step 4: Save and navigate
      setCurrentStep(3);
      setAnalysisData(analyzeData.analysis);
      saveToHistory({
        repoName: infoData.name,
        repoUrl: url,
        overallScore: analyzeData.analysis.overallScore,
        level: analyzeData.analysis.level,
        timestamp: new Date().toISOString(),
      });

      setTimeout(() => navigate("/results"), 800);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen grid-bg flex items-center justify-center p-8"
      >
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="text-red mx-auto mb-4" size={48} />
          <h2 className="font-display text-white text-xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-muted text-sm mb-6 font-code">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-accent text-bg font-display font-bold px-6 py-3 rounded-lg hover:bg-accentDim transition-colors"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen grid-bg flex items-center justify-center p-8"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="float inline-block mb-4">
            <div className="w-16 h-16 bg-surface border border-accent/30 rounded-2xl flex items-center justify-center glow-accent">
              <Terminal className="text-accent" size={28} />
            </div>
          </div>
          <h2 className="font-display text-white text-2xl font-bold mb-2">Analyzing your repository</h2>
          <p className="text-muted text-sm font-code truncate max-w-md mx-auto">{url}</p>
        </div>

        {/* Steps */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="space-y-4">
            {LOADING_STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    done ? "bg-green/20 border border-green/30" :
                    active ? "bg-accent/20 border border-accent/30 border-animate" :
                    "bg-surface border border-border"
                  }`}>
                    <step.icon
                      size={16}
                      className={done ? "text-green" : active ? "text-accent" : "text-muted"}
                    />
                  </div>
                  <span className={`font-code text-sm transition-colors ${
                    done ? "text-green" : active ? "text-text" : "text-muted"
                  }`}>
                    {step.label}
                    {active && <span className="cursor-blink ml-1">_</span>}
                    {done && <span className="ml-2 text-green text-xs">✓</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-green rounded-full"
              animate={{ width: `${((currentStep + 1) / LOADING_STEPS.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Terminal log */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface/50">
            <div className="w-2.5 h-2.5 rounded-full bg-red/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-orange/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green/60" />
            <span className="ml-2 text-muted text-xs font-code">devlens — analysis.log</span>
          </div>
          <div ref={logRef} className="p-4 h-36 overflow-y-auto space-y-1">
            {logLines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-code text-xs text-green/80"
              >
                {line}
              </motion.p>
            ))}
            <p className="font-code text-xs text-muted">
              <span className="cursor-blink">█</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
