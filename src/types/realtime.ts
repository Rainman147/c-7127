import type { RealtimeChannel } from '@supabase/supabase-js';

export type WebSocketError = {
  code: number;
  message: string;
  status: number;
};

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
}

export interface RealtimeContextValue {
  connectionState: ConnectionState;
  subscribeToChat: (chatId: string, componentId: string) => void;
  unsubscribeFromChat: (chatId: string, componentId: string) => void;
  subscribeToMessage: (messageId: string, componentId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string, componentId: string) => void;
  subscribe: (config: SubscriptionConfig) => RealtimeChannel;
  cleanup: (channelKey?: string) => void;
}