import React from 'react';
import { ErrorTracker } from '@/utils/errorTracking';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorTracker.trackError(error, {
      component: 'GlobalErrorBoundary',
      timestamp: new Date().toISOString(),
      errorType: error.name,
      severity: 'high',
      additionalInfo: {
        componentStack: errorInfo.componentStack
      }
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertTitle className="mb-4">Application Error</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                We apologize, but something went wrong. Our team has been notified and is working to fix the issue.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="mt-2 p-4 bg-black/10 rounded-md text-sm overflow-auto">
                  {this.state.error.toString()}
                </pre>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={this.handleRetry}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}