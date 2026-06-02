import { useState } from "react";
import { motion } from "framer-motion";
import { X, Github, Key, LogOut } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import { apiFetch } from "../utils/api";

export default function SettingsModal({ onClose }) {
  const { githubUser, logoutGithub, refreshAuth } = useAnalysis();
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function saveToken() {
    if (!token.trim()) return;
    setSaving(true);
    setError("");
    try {
      const user = await apiFetch("/api/auth/token", {
        method: "POST",
        body: JSON.stringify({ token: token.trim() }),
      });
      await refreshAuth();
      setToken("");
      onClose();
      void user;
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  function startOAuth() {
    window.location.href = "/api/auth/github";
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ background: "rgba(8, 12, 20, 0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-white font-bold">Settings</h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <p className="text-muted text-xs font-code">
            Tokens are stored in secure httpOnly cookies — never exposed in URLs or browser history.
          </p>

          {githubUser ? (
            <div className="flex items-center justify-between bg-surface border border-border rounded-lg p-3">
              <div className="flex items-center gap-3">
                <img src={githubUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                <span className="font-code text-sm text-text">{githubUser.login}</span>
              </div>
              <button onClick={logoutGithub} className="text-red text-xs font-code flex items-center gap-1 hover:underline">
                <LogOut size={12} /> Disconnect
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={startOAuth}
                className="w-full flex items-center justify-center gap-2 bg-surface border border-border text-text font-code text-sm py-3 rounded-lg hover:border-accent/30"
              >
                <Github size={16} /> Sign in with GitHub
              </button>
              <p className="text-muted text-xs font-code text-center">— or paste a Personal Access Token —</p>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="github_pat_..."
                autoComplete="off"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-code text-sm text-text focus:outline-none focus:border-accent mb-2"
              />
              {error && <p className="text-red text-xs font-code mb-2">{error}</p>}
              <button
                onClick={saveToken}
                disabled={saving || !token.trim()}
                className="w-full flex items-center justify-center gap-2 bg-accent text-bg font-display font-bold py-3 rounded-lg disabled:opacity-50"
              >
                <Key size={14} /> {saving ? "Validating..." : "Save Token Securely"}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
