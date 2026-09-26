import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

const MAX_AUTO_RETRIES = 3;
const AUTO_RETRY_DELAY_MS = 2000;

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    retryCount: 0,
  };

  private autoRetryTimer: ReturnType<typeof setTimeout> | null = null;

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // If this is a dynamic import / chunk load failure, a full reload
    // is the most reliable recovery (Vite hashes chunk names on deploy).
    if (this.isChunkLoadError(error)) {
      window.location.reload();
      return;
    }

    // Auto-retry: reset state after a short delay so React re-mounts
    // the component tree. This resolves transient failures such as
    // network hiccups during cold-start, race conditions in WebView
    // browsers, and one-off rendering glitches.
    if (this.state.retryCount < MAX_AUTO_RETRIES) {
      this.autoRetryTimer = setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: undefined,
          retryCount: prev.retryCount + 1,
        }));
      }, AUTO_RETRY_DELAY_MS);
    }
  }

  public componentWillUnmount() {
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
    }
  }

  private isChunkLoadError(error: Error): boolean {
    const msg = error.message || '';
    return (
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('error loading dynamically imported module')
    );
  }

  private handleManualRetry = () => {
    this.setState({ hasError: false, error: undefined, retryCount: 0 });
  };

  public render() {
    if (this.state.hasError) {
      // While auto-retrying, show a lightweight spinner instead of the
      // scary error page so users aren't alarmed during transient glitches.
      if (this.state.retryCount < MAX_AUTO_RETRIES) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-600">Reconnecting…</p>
            </div>
          </div>
        );
      }

      // All auto-retries exhausted — show the manual-recovery UI.
      return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-soft border border-neutral-200 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">
              Something went wrong
            </h1>
            
            <p className="text-neutral-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh Page</span>
              </button>
              
              <button
                onClick={this.handleManualRetry}
                className="w-full px-6 py-3 border border-primary-300 text-primary-700 font-medium rounded-xl hover:bg-primary-50 transition-colors"
              >
                Try Again Without Reloading
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="w-full px-6 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors"
              >
                Go to Home
              </button>
            </div>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-neutral-100 rounded-lg text-xs text-neutral-700 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
