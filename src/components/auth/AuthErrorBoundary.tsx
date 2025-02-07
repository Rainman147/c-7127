
import React from 'react';
import { useToast } from '@/hooks/use-toast';

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

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="rounded-lg bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Authentication Error</h2>
            <p className="mb-4 text-muted-foreground">
              There was a problem with authentication. Please try signing in again.
            </p>
            <button
              onClick={() => window.location.href = '/auth'}
              className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

