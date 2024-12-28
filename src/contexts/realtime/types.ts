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
  status: 'connected' | 'connecting' | 'disconnected';
  retryCount: number;
  lastAttempt: number;
  error?: Error;
}

export interface ConnectionStore {
  connectionState: ConnectionState;
  setConnectionState: (state: Partial<ConnectionState>) => void;
  resetState: () => void;
}

export interface RealtimeContextValue {
  connectionState: ConnectionState;
  subscribeToChat: (chatId: string, componentId: string) => void;
  unsubscribeFromChat: (chatId: string, componentId: string) => void;
  subscribeToMessage: (messageId: string, componentId: string) => void;
  unsubscribeFromMessage: (messageId: string, componentId: string) => void;
  subscribe: (config: SubscriptionConfig) => void;
  cleanup: () => void;
}