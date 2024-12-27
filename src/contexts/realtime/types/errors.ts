export interface BaseError {
  name: string;
  message: string;
  timestamp: string;
  connectionState: string;
  retryCount: number;
  lastAttempt: number;
  backoffDelay: number;
  reason: string;
}

export interface WebSocketError extends BaseError {
  name: 'WebSocketError';
}

export interface SubscriptionError extends BaseError {
  name: 'ChannelError';
  channelId: string;
  event: string;
  code?: number;
}

export interface ConnectionError extends BaseError {
  name: 'ConnectionError';
  code: number;
}

export interface RetryMetadata {
  attemptCount: number;
  lastAttemptTime: number;
  nextDelayMs: number;
  maxAttemptsReached: boolean;
}