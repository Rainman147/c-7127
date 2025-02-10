
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AuthErrorBoundary] Error caught:', error, errorInfo);
  }

  private isAuthError(error: Error): boolean {
    return error.message.toLowerCase().includes('auth') || 
           error.message.toLowerCase().includes('unauthorized') ||
           error.message.toLowerCase().includes('unauthenticated');
  }

  private handleRetry = () => {
    window.location.reload();
  };

  private handleSignIn = () => {
    window.location.href = '/auth';
  };

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error && this.isAuthError(this.state.error);
      
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {isAuthError ? 'Authentication Error' : 'Application Error'}
              </AlertTitle>
              <AlertDescription>
                {this.state.error?.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
              {isAuthError && (
                <Button
                  onClick={this.handleSignIn}
                  className="w-full"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
