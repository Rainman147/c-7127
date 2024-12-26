export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  error?: Error;
  lastAttempt: number;
}

export interface ConnectionStateUpdate {
  status?: ConnectionStatus;
  retryCount?: number;
  error?: Error;
}