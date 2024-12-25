export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  error: Error | null;
}

export interface ConnectionStateUpdate {
  status?: ConnectionStatus;
  retryCount?: number;
  error?: Error | null;
}