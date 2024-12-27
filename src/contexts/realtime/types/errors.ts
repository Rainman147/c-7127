export interface WebSocketError {
  code?: number;
  reason?: string;
  timestamp: string;
  connectionState: string;
  retryCount: number;
}

export interface SubscriptionError extends WebSocketError {
  channelId: string;
  event: string;
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