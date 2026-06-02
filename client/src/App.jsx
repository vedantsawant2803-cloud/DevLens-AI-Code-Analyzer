import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LandingPage from "./pages/LandingPage";
import AnalyzePage from "./pages/AnalyzePage";
import ResultsPage from "./pages/ResultsPage";
import DashboardPage from "./pages/DashboardPage";
import ComparePage from "./pages/ComparePage";
import QueuePage from "./pages/QueuePage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import { AnalysisProvider } from "./context/AnalysisContext";

export default function App() {
  const location = useLocation();

  return (
    <AnalysisProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </AnimatePresence>
    </AnalysisProvider>
  );
}
