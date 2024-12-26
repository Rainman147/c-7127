export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  error?: Error | null;
  lastAttempt: number;
}

export interface ConnectionStore {
  state: ConnectionState;
  updateState: (newState: Partial<ConnectionState>) => void;
  resetState: () => void;
}