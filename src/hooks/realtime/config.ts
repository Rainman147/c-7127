export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  retryCount: number;
  error?: Error;
}

export const INITIAL_CONNECTION_STATE: ConnectionState = {
  status: 'disconnected',
  retryCount: 0
};