import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
          <div className="relative group w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-danger/30 to-danger/10 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative glass border border-danger/20 rounded-3xl p-10 w-full text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger to-transparent"></div>
              
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-danger/10 rounded-2xl">
                  <AlertTriangle className="w-12 h-12 text-danger animate-pulse" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-3">
                Erreur de l'application
              </h1>
              
              <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
                {this.state.error?.message ||
                  "L'application a rencontré un problème inattendu avec l'API Mode. Veuillez réessayer."}
              </p>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center space-x-2 bg-danger/10 hover:bg-danger text-danger hover:text-white px-6 py-3.5 rounded-xl transition-all duration-300 font-medium group/btn shadow-lg shadow-danger/5"
              >
                <RefreshCcw className="w-5 h-5 transform group-hover/btn:-rotate-180 transition-transform duration-500" />
                <span>Tenter de se reconnecter</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
