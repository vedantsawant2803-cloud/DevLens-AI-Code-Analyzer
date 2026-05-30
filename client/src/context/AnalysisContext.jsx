import { createContext, useContext, useState } from "react";

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [repoInfo, setRepoInfo] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("devlens_history") || "[]");
    } catch {
      return [];
    }
  });

  function saveToHistory(entry) {
    const newHistory = [entry, ...history].slice(0, 10); // keep last 10
    setHistory(newHistory);
    try {
      localStorage.setItem("devlens_history", JSON.stringify(newHistory));
    } catch {
      // storage might be unavailable
    }
  }

  return (
    <AnalysisContext.Provider value={{ analysisData, setAnalysisData, repoInfo, setRepoInfo, history, saveToHistory }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
