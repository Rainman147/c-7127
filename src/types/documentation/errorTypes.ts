export interface ErrorState {
  category: ErrorCategory;
  message: string;
  retryCount: number;
  timestamp: string;
  recoverable: boolean;
}

export type ErrorCategory =
  | 'network'
  | 'auth'
  | 'processing'
  | 'business';