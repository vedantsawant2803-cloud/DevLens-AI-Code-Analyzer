import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAnalysis } from "../context/AnalysisContext";

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshAuth } = useAnalysis();

  useEffect(() => {
    const success = params.get("success");
    const failed = params.get("auth") === "failed";

    if (success) {
      refreshAuth().then(() => navigate("/", { replace: true }));
    } else if (failed) {
      navigate("/?auth=failed", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center">
      <p className="text-muted font-code text-sm">Connecting GitHub...</p>
    </div>
  );
}
