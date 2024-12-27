import React, { Component, ErrorInfo } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { toast } from '@/hooks/use-toast';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ChatInputErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(LogCategory.ERROR, 'ChatInputErrorBoundary', 'Component error:', {
      error: error.message,
      stack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    ErrorTracker.trackError(error, {
      component: 'ChatInput',
      severity: 'high',
      timestamp: new Date().toISOString(),
      errorType: 'component-crash',
      additionalInfo: {
        componentStack: errorInfo.componentStack,
        lastRetryTimestamp: new Date().toISOString()
      }
    });

    toast({
      title: "Something went wrong",
      description: "The chat input encountered an error. Please try refreshing the page.",
      variant: "destructive",
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="p-4 text-center bg-destructive/10 rounded-md" 
          role="alert"
          aria-live="assertive"
        >
          <p className="text-destructive mb-2">
            Something went wrong with the chat input.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}