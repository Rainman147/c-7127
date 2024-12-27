import React, { Component, ErrorInfo } from 'react';
import { logger, LogCategory } from '@/utils/logging';
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

    toast({
      title: "Error",
      description: "Something went wrong with the chat input. Please refresh the page.",
      variant: "destructive",
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center" role="alert">
          <p className="text-red-500">Something went wrong with the chat input.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-blue-500 hover:underline"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}