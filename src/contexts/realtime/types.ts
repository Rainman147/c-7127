import type { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  lastAttempt: number;
  error?: Error;
}

export interface SubscriptionConfig {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter: string;
  onMessage: (payload: any) => void;
  onError: (error: Error) => void;
  onSubscriptionStatus: (status: string) => void;
}

export interface SubscriptionState {
  channel?: RealtimeChannel;
  status: 'subscribed' | 'unsubscribed' | 'error';
  error?: Error;
}

export interface RealtimeContextValue {
  connectionState: ConnectionState;
  lastMessage: any;
  subscribeToChat: (chatId: string, componentId: string) => void;
  unsubscribeFromChat: (chatId: string, componentId: string) => void;
  subscribeToMessage: (messageId: string, componentId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string, componentId: string) => void;
  subscribe: (config: SubscriptionConfig) => void;
  cleanup: () => void;
}