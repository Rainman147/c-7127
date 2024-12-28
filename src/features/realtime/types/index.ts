export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface WebSocketError {
  code: number;
  message: string;
  status: number;
}

export interface ConnectionState {
  status: ConnectionStatus;
  error?: WebSocketError;
  retryCount: number;
  lastAttempt: number;
}

export interface SubscriptionConfig {
  event: 'postgres_changes';
  schema: string;
  table: string;
  filter?: string;
  onMessage?: (payload: any) => void;
  onError?: (error: Error) => void;
  onSubscriptionStatus?: (status: string) => void;
}

export interface RealtimeContextValue {
  connectionState: ConnectionState;
  lastMessage?: any;
  subscribeToChat: (chatId: string, componentId: string) => void;
  unsubscribeFromChat: (chatId: string, componentId: string) => void;
  subscribeToMessage: (messageId: string, componentId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string, componentId: string) => void;
  subscribe: (config: SubscriptionConfig) => any;
  cleanup: () => void;
}