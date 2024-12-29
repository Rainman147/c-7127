export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  options?: {
    timeout?: number;
    maxRetries?: number;
    retryInterval?: number;
  };
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketState {
  status: WebSocketStatus;
  error?: Error;
  lastPing?: number;
  reconnectAttempts: number;
}