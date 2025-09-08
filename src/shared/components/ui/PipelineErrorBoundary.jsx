import React from 'react';
import { uiLogger } from '@utils/logger';

class PipelineErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    uiLogger.error('Pipeline Error Boundary caught an error', error, { errorInfo });
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <h3 className="text-lg font-semibold mb-2">Pipeline Error</h3>
              <p className="text-sm text-red-500 mb-4">
                Something went wrong with the pipeline component.
              </p>
              {this.state.error && (
                <details className="text-left bg-red-100 p-3 rounded text-xs">
                  <summary className="cursor-pointer font-medium mb-2">
                    Error Details
                  </summary>
                  <pre className="whitespace-pre-wrap text-red-700">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>

            <div className="space-x-4">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {this.state.retryCount > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Retry attempt: {this.state.retryCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PipelineErrorBoundary;
