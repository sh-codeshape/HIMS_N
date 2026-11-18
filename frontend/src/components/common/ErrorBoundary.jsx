import React from "react";
import Icon from "./Icon.jsx";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 my-4 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-base text-red-900">
              <Icon name="LuAlertTriangle" size={20} className="text-red-600" />
              <span>Something went wrong loading this section</span>
            </div>
            <p className="text-sm text-red-700">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
