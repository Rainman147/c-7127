import type { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  lastAttempt: number;
  error?: Error;
}

export interface WebSocketError {
  code?: number;
  message: string;
  status?: number;
}

export interface SubscriptionConfig {
  event: 'postgres_changes';
  schema: string;
  table: string;
  filter?: string;
  onMessage: (payload: any) => void;
  onError?: (error: Error) => void;
  onSubscriptionStatus?: (status: REALTIME_SUBSCRIBE_STATES) => void;
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

export interface RetryMetadata {
  attemptCount: number;
  lastAttemptTime: number;
  nextDelayMs: number;
  maxAttemptsReached: boolean;
}

export type RealtimeSubscribeStates = REALTIME_SUBSCRIBE_STATES;