import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  lastAttempt: number;
  retryCount: number;
  error?: Error;
}

export interface SubscriptionConfig {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
  onMessage: (payload: any) => void;
  onError?: (error: Error) => void;
  onSubscriptionChange?: (status: string) => void;
}

export interface RealtimeContextValue {
  connectionState: ConnectionState;
  lastMessage?: Message;
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  subscribeToMessage: (messageId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string) => void;
}