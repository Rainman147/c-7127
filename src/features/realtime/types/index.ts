export interface WebSocketError {
  code: number;
  message: string;
  status: number;
}

export interface SubscriptionConfig {
  event: 'postgres_changes';
  schema: string;
  table: string;
  filter?: string;
}

export interface ConnectionState {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  error?: WebSocketError;
}

export interface SubscriptionState {
  isSubscribed: boolean;
  error?: Error;
  lastEventTime?: number;
}

export type SubscriptionHandler = (payload: any) => void;