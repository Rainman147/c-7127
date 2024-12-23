import React from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export class PostMessageErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(
      LogCategory.ERROR,
      'PostMessageErrorBoundary',
      'Communication error caught',
      { error, errorInfo }
    );
  }

  handleRetry = async () => {
    const { retryCount } = this.state;
    
    if (retryCount >= MAX_RETRIES) {
      logger.error(
        LogCategory.ERROR,
        'PostMessageErrorBoundary',
        'Max retries exceeded',
        { retryCount }
      );
      return;
    }

    logger.info(
      LogCategory.COMMUNICATION,
      'PostMessageErrorBoundary',
      'Attempting retry',
      { attempt: retryCount + 1 }
    );

    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Communication Error</AlertTitle>
          <AlertDescription className="mt-2">
            There was an error communicating with the chat service.
            {this.state.retryCount < MAX_RETRIES && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={this.handleRetry}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </Button>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}