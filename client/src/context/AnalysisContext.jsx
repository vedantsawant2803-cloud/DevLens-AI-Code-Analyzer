import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch } from "../utils/api";

const AnalysisContext = createContext(null);

const HISTORY_KEY = "devlens_history_v2";
const QUEUE_KEY = "devlens_queue";
const THEME_KEY = "devlens_theme";

export function AnalysisProvider({ children }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [repoInfo, setRepoInfo] = useState(null);
  const [insights, setInsights] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [focus, setFocus] = useState("fullstack");
  const [githubUser, setGithubUser] = useState(null);

  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
  });
  const [queue, setQueue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
  });

  const refreshAuth = useCallback(async () => {
    try {
      const user = await apiFetch("/api/auth/me");
      setGithubUser(user);
      return user;
    } catch {
      setGithubUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  async function logoutGithub() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    setGithubUser(null);
  }

  function saveToHistory(entry) {
    const newHistory = [entry, ...history.filter((h) => h.repoUrl !== entry.repoUrl)].slice(0, 50);
    setHistory(newHistory);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory)); } catch { /* ignore */ }
  }

  function addToQueue(url, opts = {}) {
    const item = { id: Date.now(), url, focus: opts.focus || "fullstack", status: "pending" };
    const newQueue = [...queue, item];
    setQueue(newQueue);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
    return item;
  }

  function removeFromQueue(id) {
    const newQueue = queue.filter((q) => q.id !== id);
    setQueue(newQueue);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
  }

  function updateQueueItem(id, updates) {
    const newQueue = queue.map((q) => (q.id === id ? { ...q, ...updates } : q));
    setQueue(newQueue);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
  }

  function clearQueue() {
    setQueue([]);
    localStorage.removeItem(QUEUE_KEY);
  }

  return (
    <AnalysisContext.Provider
      value={{
        analysisData, setAnalysisData,
        repoInfo, setRepoInfo,
        insights, setInsights,
        compareData, setCompareData,
        focus, setFocus,
        theme, toggleTheme,
        githubUser, refreshAuth, logoutGithub,
        history, saveToHistory,
        queue, addToQueue, removeFromQueue, updateQueueItem, clearQueue,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
