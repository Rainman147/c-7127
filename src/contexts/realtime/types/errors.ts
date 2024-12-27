export interface WebSocketError {
  code?: number;
  reason?: string;
  timestamp: string;
  connectionState: string;
  retryCount: number;
  name: string;
  message: string;
}

export interface SubscriptionError extends WebSocketError {
  channelId: string;
  event: string;
  lastAttempt: number;
  backoffDelay: number;
}

export interface ConnectionError extends WebSocketError {
  lastAttempt: number;
  backoffDelay: number;
}

export interface RetryMetadata {
  attemptCount: number;
  lastAttemptTime: number;
  nextDelayMs: number;
  maxAttemptsReached: boolean;
}