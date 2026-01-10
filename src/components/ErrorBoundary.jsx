import React from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log for diagnostics
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleRetry() {
    this.setState({ hasError: false, error: null });
    // If a reset callback was provided (e.g. to reset route state), call it
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border-4 border-red-500 rounded-lg p-8 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full border-2 border-red-500 mb-6 text-red-600 dark:text-red-400">
              <AlertTriangle size={32} />
            </div>
            
            <h2 className="text-2xl font-black mb-2 font-display text-black dark:text-white">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              We encountered an unexpected error.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white font-bold border-2 border-black dark:border-white rounded-lg shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#FFF] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#000] dark:hover:shadow-[5px_5px_0px_#FFF] transition-all"
              >
                <RotateCcw size={18} />
                Try Again
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-black dark:text-white font-bold border-2 border-black dark:border-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw size={18} />
                Reload Page
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-8 text-left bg-gray-100 dark:bg-gray-900 p-4 rounded border border-gray-300 dark:border-gray-700 overflow-auto max-h-48">
                <p className="font-mono text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
