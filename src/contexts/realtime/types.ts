export type SubscriptionEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE';

export interface SubscriptionConfig {
  event: SubscriptionEvent;
  schema: string;
  table: string;
  filter?: string;
  onMessage: (payload: any) => void;
  onError: (error: Error) => void;
  onSubscriptionStatus: (status: string) => void;
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected';
  retryCount: number;
  lastAttempt: number;
  error?: Error;
}

export interface ConnectionStore {
  connectionState: ConnectionState;
  setConnectionState: (state: Partial<ConnectionState>) => void;
}