export interface WebSocketError {
  name: string;
  message: string;
  timestamp: string;
  connectionState: 'error' | 'disconnected';
  retryCount: number;
  lastAttempt: number;
  backoffDelay: number;
}

export interface ConnectionError {
  reason?: string;
  timestamp: string;
  retryCount: number;
}