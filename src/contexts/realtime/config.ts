export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  lastAttempt: number;
  retryCount: number;
  error?: Error;
}

export interface RealTimeContextValue {
  connectionState: ConnectionState;
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  activeSubscriptions: Set<string>;
  lastMessage?: Message;
  retryCount: number;
}

import type { Message } from '@/types/chat';