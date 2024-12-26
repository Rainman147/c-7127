import type { Message } from '@/types/chat';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  error?: Error;
  lastAttempt: number;
}

export interface SubscriptionConfig {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
  onMessage: (payload: any) => void;
  onError?: (error: Error) => void;
  onSubscriptionStatus?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void;
}

export interface RealtimeContextValue {
  connectionState: ConnectionState;
  lastMessage?: Message;
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  subscribeToMessage: (messageId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string) => void;
  subscribe: (config: SubscriptionConfig) => RealtimeChannel;
  cleanup: (channelKey?: string) => void;
}