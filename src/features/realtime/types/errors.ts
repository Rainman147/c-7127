export interface RetryMetadata {
  attemptCount: number;
  lastAttemptTime: number;
  nextDelayMs: number;
  maxAttemptsReached: boolean;
}

export interface WebSocketError {
  code: number;
  message: string;
  status: number;
  reason?: string;
}

export interface SubscriptionError {
  name: 'ChannelError';
  message: string;
  timestamp: string;
  connectionState: string;
  retryCount: number;
  lastAttempt: number;
  backoffDelay: number;
  channelId: string;
}