import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useToast } from '../context/ToastContext';
import { logError, getUserFriendlyError } from '../utils/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props & { addToast: (message: string, type: 'error' | 'warning' | 'success') => void }, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  private lastError: number = 0;
  private errorCount: number = 0;
  private retryTimeout: number | null = null;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    // Reset error count if last error was more than 5 minutes ago
    if (now - this.lastError > 5 * 60 * 1000) {
      this.errorCount = 0;
    }
    this.lastError = now;
    this.errorCount++;

    // Log the error
    logError(error, errorInfo.componentStack || undefined);
    
    this.setState({ errorInfo });
    
    const message = getUserFriendlyError(error);
    this.props.addToast(message, 'error');

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public componentWillUnmount() {
    // Clean up any pending retry timeout
    if (this.retryTimeout !== null) {
      window.clearTimeout(this.retryTimeout);
    }
  }

  private handleRetry = () => {
    // If too many errors, suggest page reload
    if (this.errorCount >= 3) {
      this.props.addToast('Too many errors occurred. Please try reloading the page.', 'warning');
      return;
    }

    // Clear the error state
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Add a small delay before retry to ensure clean re-render
    this.retryTimeout = window.setTimeout(() => {
      this.props.addToast('Retrying...', 'success');
    }, 100);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h2 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            {getUserFriendlyError(this.state.error)}
          </p>
          <div className="flex gap-4">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Try again
            </button>
            {this.errorCount >= 3 && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Reload page
              </button>
            )}
          </div>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto text-xs">
              <code className="text-red-600 dark:text-red-400">
                {this.state.error?.stack}
                {'\n\nComponent Stack:\n'}
                {this.state.errorInfo.componentStack}
              </code>
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to provide toast context
export const ErrorBoundary: React.FC<Props> = ({ children, fallback, onError }) => {
  const { addToast } = useToast();
  return <ErrorBoundaryClass addToast={addToast} fallback={fallback} onError={onError}>{children}</ErrorBoundaryClass>;
};

export default ErrorBoundary;