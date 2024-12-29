export interface WebSocketError {
  code: number;
  status: number;
  message: string;
  name?: string;
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

export interface RealtimeChannel {
  topic: string;
  params: Record<string, any>;
  socket: any;
  bindings: any[];
  subscribe: (timeout?: number) => Promise<'ok' | 'timed out' | 'error'>;
  unsubscribe: () => void;
}