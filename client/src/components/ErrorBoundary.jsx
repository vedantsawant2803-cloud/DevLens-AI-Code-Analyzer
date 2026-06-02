import { Component } from "react";
import { AlertCircle } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("DevLens UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid-bg flex items-center justify-center p-8">
          <div className="glass rounded-2xl p-8 max-w-md text-center">
            <AlertCircle className="text-red mx-auto mb-4" size={48} />
            <h2 className="font-display text-white text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted text-sm font-code mb-6">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.href = "/"}
              className="bg-accent text-bg font-display font-bold px-6 py-3 rounded-lg"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
