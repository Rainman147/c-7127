import type { Message } from '@/types/chat';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  lastAttempt: number;
  retryCount: number;
}

export interface RealTimeContextValue {
  connectionState: ConnectionState;
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  activeSubscriptions: Set<string>;
  lastMessage?: Message;
  retryCount: number;
}