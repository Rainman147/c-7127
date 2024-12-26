import { create } from 'zustand';
import { logger, LogCategory } from '@/utils/logging';
import type { ConnectionState, ConnectionStore } from './types';

const INITIAL_STATE: ConnectionState = {
  status: 'connecting',
  retryCount: 0,
  error: null,
  lastAttempt: Date.now()
};

export const useConnectionState = create<ConnectionStore>((set) => ({
  state: INITIAL_STATE,
  updateState: (newState) => {
    set((current) => {
      const updatedState = {
        ...current.state,
        ...newState,
        lastAttempt: Date.now()
      };

      logger.info(LogCategory.STATE, 'ConnectionState', 'State transition', {
        from: current.state.status,
        to: updatedState.status,
        retryCount: updatedState.retryCount,
        timestamp: new Date().toISOString()
      });

      return { state: updatedState };
    });
  },
  resetState: () => set({ state: INITIAL_STATE })
}));
</I'll fix the build errors and continue implementing the real-time functionality in a focused way. Let's break down the RealTimeContext into smaller, more manageable pieces.

<lov-code>
First, let's fix the type issues and break down the RealTimeContext into smaller modules:

1. Update the types file:

<lov-write file_path="src/contexts/realtime/types.ts">
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  error?: Error | null;
  lastAttempt: number;
}

export interface ConnectionStore {
  state: ConnectionState;
  updateState: (newState: Partial<ConnectionState>) => void;
  resetState: () => void;
}

export interface RealtimeContextValue {
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  subscribeToMessage: (messageId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string) => void;
  connectionState: ConnectionState;
  lastMessage?: Message;
}

export interface SubscriptionConfig {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema: string;
  table: string;
  filter?: string;
  onMessage: (payload: any) => void;
  onError?: (error: Error) => void;
  onSubscriptionChange?: (status: string) => void;
}

import type { Message } from '@/types/chat';