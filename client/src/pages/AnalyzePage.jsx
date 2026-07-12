import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Terminal, GitBranch, Cpu, FileCode, CheckCircle, AlertCircle, Search, X, Clock } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import { runFullAnalysis } from "../utils/api";

const LOADING_STEPS = [
  { icon: GitBranch, label: "Connecting to GitHub & fetching metadata...", key: "github" },
  { icon: FileCode, label: "Fetching source files (tree scan)...", key: "files" },
  { icon: Search, label: "Running AI analysis & scanning dependencies...", key: "ai" },
  { icon: CheckCircle, label: "Building your report...", key: "report" },
];

const LOG_LINES = [
  "> Initializing DevLens v2 analysis engine...",
  "> Authenticating with GitHub API...",
  "> Scanning repository tree (recursive)...",
  "> Fetching dependency manifests in parallel...",
  "> Sending code to Gemini AI for review...",
  "> Processing AI response...",
  "> Building file-level breakdown...",
  "> Generating fix-it prompt...",
  "> Caching badge score...",
  "> Finalizing report...",
];

export default function AnalyzePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAnalysisData, setRepoInfo, setInsights, saveToHistory } = useAnalysis();
  const url = location.state?.url;
  const focus = location.state?.focus || "fullstack";

  const [currentStep, setCurrentStep] = useState(0);
  const [logLines, setLogLines] = useState([LOG_LINES[0]]);
  const [error, setError] = useState("");
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const logRef = useRef(null);
  const abortRef = useRef(null); // AbortController for cancel support
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Redirect if no URL passed
  useEffect(() => {
    if (!url) { navigate("/"); return; }
    startTimeRef.current = Date.now();
    runAnalysis();
    // Elapsed time ticker
    timerRef.current = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll log terminal
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  // Append log lines on an interval to simulate progress
  useEffect(() => {
    if (error) return;
    if (logLines.length < LOG_LINES.length) {
      const timer = setTimeout(
        () => setLogLines((prev) => [...prev, LOG_LINES[prev.length]]),
        900
      );
      return () => clearTimeout(timer);
    }
  }, [logLines, error]);

  function addLog(line) {
    setLogLines((prev) => [...prev, line]);
  }

  async function runAnalysis() {
    try {
      setCurrentStep(0);

      // Step 0→1: Parallel info + files fetch
      const result = await runFullAnalysis(url, {
        focus,
        onStep: (step) => {
          if (step === "files") { setCurrentStep(1); addLog("> Files received from GitHub..."); }
          if (step === "ai")    { setCurrentStep(2); addLog("> Gemini AI processing your code..."); }
        },
      });

      setCurrentStep(2);
      setRepoInfo(result.info);
      setInsights(result.insights);

      setAnalysisData(result.analysis);
      setCurrentStep(3);

      saveToHistory({
        repoName: result.info.name,
        repoUrl: url,
        overallScore: result.analysis.overallScore,
        level: result.analysis.level,
        scores: result.analysis.scores,
        focus,
        timestamp: new Date().toISOString(),
      });

      clearInterval(timerRef.current);
      addLog("> ✓ Analysis complete!");
      setTimeout(() => navigate("/results"), 600);
    } catch (err) {
      clearInterval(timerRef.current);
      setError(err.message || "Something went wrong. Please try again.");
    }
  }

  function handleCancel() {
    clearInterval(timerRef.current);
    navigate("/");
  }

  const progressPct = Math.round(((currentStep + 1) / LOADING_STEPS.length) * 100);

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen grid-bg flex items-center justify-center p-8">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="text-red mx-auto mb-4" size={48} />
          <h2 className="font-display text-white text-xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-muted text-sm mb-2 font-code">{error}</p>
          {elapsedSecs > 60 && (
            <p className="text-muted text-xs mb-4 font-code opacity-60">
              Elapsed: {elapsedSecs}s — try a smaller or newer repo, or a specific PR URL.
            </p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate("/")} className="bg-accent text-bg font-display font-bold px-6 py-3 rounded-lg hover:bg-accentDim transition-colors">
              Try Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen grid-bg flex items-center justify-center p-8">
      <div className="relative z-10 max-w-2xl w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="float inline-block mb-4">
            <div className="w-16 h-16 bg-surface border border-accent/30 rounded-2xl flex items-center justify-center glow-accent">
              <Terminal className="text-accent" size={28} />
            </div>
          </div>
          <h2 className="font-display text-white text-2xl font-bold mb-2">Analyzing repository</h2>
          <p className="text-muted text-sm font-code truncate max-w-md mx-auto">{url}</p>
          <p className="text-accent text-xs font-code mt-1 capitalize">Focus: {focus}</p>
        </div>

        {/* Steps */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="space-y-4">
            {LOADING_STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    done   ? "bg-green/20 border border-green/30" :
                    active ? "bg-accent/20 border border-accent/30 border-animate" :
                             "bg-surface border border-border"
                  }`}>
                    <step.icon size={16} className={done ? "text-green" : active ? "text-accent" : "text-muted"} />
                  </div>
                  <span className={`font-code text-sm flex-1 ${done ? "text-green" : active ? "text-text" : "text-muted"}`}>
                    {step.label}
                    {active && <span className="cursor-blink ml-1">_</span>}
                    {done   && <span className="ml-2 text-green text-xs">✓</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-green rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Elapsed time + cancel */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted text-xs font-code">
              <Clock size={12} />
              <span>{elapsedSecs}s elapsed</span>
              {elapsedSecs > 30 && <span className="text-orange ml-1">— AI is thinking, please wait…</span>}
            </div>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-muted hover:text-red text-xs font-code transition-colors"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>

        {/* Log terminal */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface/50">
            <div className="w-2.5 h-2.5 rounded-full bg-red/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-orange/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green/60" />
            <span className="ml-2 text-muted text-xs font-code">devlens — analysis.log</span>
          </div>
          <div ref={logRef} className="p-4 h-40 overflow-y-auto space-y-1">
            {logLines.map((line, i) => (
              <motion.p key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-code text-xs text-green/80">
                {line}
              </motion.p>
            ))}
            <p className="font-code text-xs text-muted"><span className="cursor-blink">█</span></p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
