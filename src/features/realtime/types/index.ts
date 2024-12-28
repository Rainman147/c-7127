import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface SubscriptionConfig {
  table: string;
  schema?: string;
  filter?: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onMessage: (payload: RealtimePostgresChangesPayload<any>) => void;
  onSubscriptionStatus?: (status: string) => void;
}

export interface RealtimeContextValue {
  connectionState: {
    status: 'connecting' | 'connected' | 'disconnected';
    retryCount: number;
    lastAttempt: number;
    error?: Error;
  };
  lastMessage?: any;
  subscribeToChat: (chatId: string, componentId: string) => void;
  unsubscribeFromChat: (chatId: string, componentId: string) => void;
  subscribeToMessage: (messageId: string, componentId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string, componentId: string) => void;
  subscribe: (config: SubscriptionConfig) => RealtimeChannel;
  cleanup: (channelKey?: string) => void;
}