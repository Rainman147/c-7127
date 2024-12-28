import type { Message } from '@/types/chat';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

export interface SubscriptionConfig {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
  onMessage: (payload: any) => void;
  onError?: (error: Error) => void;
  onSubscriptionStatus?: (status: string) => void;
}

export interface RealtimeContextValue {
  connectionState: ConnectionState;
  lastMessage?: Message;
  subscribeToChat: (chatId: string, componentId: string) => void;
  unsubscribeFromChat: (chatId: string, componentId: string) => void;
  subscribeToMessage: (messageId: string, componentId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string, componentId: string) => void;
  subscribe: (config: SubscriptionConfig) => RealtimeChannel;
  cleanup: (channelKey?: string) => void;
}

// Error types
export interface ConnectionError {
  name: string;
  code?: number;
  reason?: string;
  timestamp: string;
  connectionState: string;
  retryCount: number;
  lastAttempt: number;
  backoffDelay: number;
  message: string;
}

export interface SubscriptionError extends ConnectionError {
  channelId: string;
  event: string;
}

export interface WebSocketError extends ConnectionError {
  socketId?: string;
}