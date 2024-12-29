export interface WebSocketError extends Error {
  code: number;
  status: number;
  reason?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  lastAttempt: number;
  error?: WebSocketError;
}

export interface SubscriptionConfig {
  event: 'postgres_changes';
  schema: string;
  table: string;
  filter?: string;
  onMessage: (payload: any) => void;
  onError?: (error: WebSocketError) => void;
  onSubscriptionStatus?: (status: string) => void;
}