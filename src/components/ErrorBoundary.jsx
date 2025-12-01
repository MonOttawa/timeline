import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log for diagnostics; in production you might route this to an error service.
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      return (
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Something went wrong.</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Please refresh and try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
