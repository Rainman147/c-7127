import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  error?: Error;
  lastAttempt: number;
}

export interface ConnectionStore {
  state: ConnectionState;
  updateState: (newState: Partial<ConnectionState>) => void;
  resetState: () => void;
}

export interface RealtimeContextValue {
  connectionState: ConnectionState;
  lastMessage?: Message;
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  subscribeToMessage: (messageId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string) => void;
}

export interface SubscriptionConfig {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
  onMessage: (payload: any) => void;
  onError?: (error: Error) => void;
}