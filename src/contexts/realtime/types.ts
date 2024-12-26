import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  lastAttempt: number;
  retryCount: number;
  error?: Error;
}

export interface ConnectionStore {
  state: ConnectionState;
  updateState: (state: Partial<ConnectionState>) => void;
  resetState: () => void;
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
  subscribe: (config: SubscriptionConfig) => RealtimeChannel;
  unsubscribe: (channelId: string) => void;
  cleanup: () => void;
}