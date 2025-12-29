import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">Terjadi Kesalahan</h3>
            <p className="text-text-muted-light dark:text-text-muted-dark mb-4">
              Aplikasi mengalami masalah saat memuat.
            </p>
            <details className="text-left">
              <summary className="text-sm text-red-500 cursor-pointer">Lihat detail</summary>
              <pre className="text-xs mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">
                {this.state.error && this.state.error.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-md"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;