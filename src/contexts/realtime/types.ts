import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';
import type { ConnectionState } from './config';

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
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  subscribeToMessage: (messageId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string) => void;
  connectionState: ConnectionState;
  lastMessage?: Message;
}