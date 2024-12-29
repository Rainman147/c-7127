export interface WebSocketError {
  code: number;
  message: string;
  status: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

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

export interface RealtimeContextValue {
  connectionState: ConnectionState;
  subscribeToChat: (chatId: string, componentId: string) => void;
  unsubscribeFromChat: (chatId: string, componentId: string) => void;
  subscribeToMessage: (messageId: string, componentId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string, componentId: string) => void;
  subscribe: (config: SubscriptionConfig) => any;
  cleanup: (channelKey?: string) => void;
}

export interface SubscriptionHandler {
  (payload: any): void;
}

export interface RetryMetadata {
  attemptCount: number;
  lastAttemptTime: number;
  nextDelayMs: number;
  maxAttemptsReached: boolean;
}