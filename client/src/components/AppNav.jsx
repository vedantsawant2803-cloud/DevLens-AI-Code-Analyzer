import { Link, useLocation } from "react-router-dom";
import { Terminal, Sun, Moon, LayoutDashboard, GitCompare, ListOrdered, Settings, Github } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import SettingsModal from "./SettingsModal";
import { useState } from "react";

export default function AppNav() {
  const { theme, toggleTheme, githubUser, queue } = useAnalysis();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);

  const links = [
    { to: "/", label: "Analyze", icon: Terminal },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/compare", label: "Compare", icon: GitCompare },
    { to: "/queue", label: "Queue", icon: ListOrdered, badge: queue.filter((q) => q.status === "pending").length },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Terminal className="text-accent" size={20} />
            <span className="font-display text-white font-bold tracking-wider hidden sm:inline">DevLens</span>
            <span className="text-xs text-muted font-code bg-surface border border-border px-2 py-0.5 rounded">v2</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {links.map(({ to, label, icon: Icon, badge }) => (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-code transition-colors ${
                  location.pathname === to
                    ? "bg-accent/10 text-accent border border-accent/30"
                    : "text-muted hover:text-text hover:bg-surface"
                }`}
              >
                <Icon size={14} />
                <span className="hidden md:inline">{label}</span>
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-bg text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {githubUser && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-code text-muted">
                <img src={githubUser.avatar} alt="" className="w-6 h-6 rounded-full border border-border" />
                {githubUser.login}
              </div>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <a
              href="https://github.com/vedantsawant2803-cloud/DevLens-AI-Code-Analyzer"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors hidden sm:block"
            >
              <Github size={16} />
            </a>
          </div>
        </div>
      </nav>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
