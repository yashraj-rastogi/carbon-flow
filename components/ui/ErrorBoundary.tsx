'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback UI to show when an error is caught. */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary component.
 * Catches JavaScript errors anywhere in its child component tree,
 * logs them, and displays a graceful fallback UI instead of crashing.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="min-h-[200px] flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-rose-500/20 bg-rose-950/5"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <span className="text-rose-400 text-xl" aria-hidden="true">⚠</span>
          </div>
          <div className="text-center">
            <h2 className="text-sm font-bold text-zinc-100 mb-1">Something went wrong</h2>
            <p className="text-[11px] text-zinc-400 max-w-sm">
              An unexpected error occurred in this section. Please refresh the page or try again later.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-950 bg-rose-400 hover:bg-rose-300 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
