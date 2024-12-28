export interface RetryMetadata {
  attemptCount: number;
  lastAttemptTime: number;
  nextDelayMs: number;
  maxAttemptsReached: boolean;
}

export interface CustomError {
  name: ErrorType;
  message: string;
  timestamp: string;
  connectionState: string;
  retryCount: number;
  lastAttempt: number;
  backoffDelay: number;
  reason: string;
  code?: number;
}

export type ErrorType = 'WebSocketError' | 'ChannelError' | 'ConnectionError';

export interface WebSocketError extends CustomError {
  name: 'WebSocketError';
}

export interface SubscriptionError extends CustomError {
  name: 'ChannelError';
  channelId: string;
  event: string;
}

export interface ConnectionError extends CustomError {
  name: 'ConnectionError';
  code: number;
}