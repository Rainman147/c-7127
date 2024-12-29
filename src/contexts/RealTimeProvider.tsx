import React, { createContext, useContext, useEffect } from 'react';
import { useConnectionState } from '@/features/realtime/hooks/useConnectionState';
import { useMessageHandlers } from '@/features/realtime/hooks/useMessageHandlers';
import { useSubscriptionManager } from '@/features/realtime/hooks/useSubscriptionManager';
import type { RealtimeContextValue } from '@/types/realtime';
import { supabase } from '@/integrations/supabase/client';

const RealTimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export const RealTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connectionState, handleConnectionSuccess, handleConnectionError } = useConnectionState();
  const { handleChatMessage, handleMessageUpdate } = useMessageHandlers();
  const { subscribe, cleanup } = useSubscriptionManager();

  useEffect(() => {
    const channel = supabase.channel('any')
      .on('presence', { event: 'sync' }, () => {
        handleConnectionSuccess();
      })
      .on('presence', { event: 'join' }, () => {
        handleConnectionSuccess();
      })
      .on('presence', { event: 'leave' }, () => {
        handleConnectionError(new Error('Connection lost'));
      })
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [handleConnectionSuccess, handleConnectionError]);

  const value: RealtimeContextValue = {
    connectionState,
    subscribeToChat: (chatId: string, componentId: string) => {
      subscribe({
        event: 'postgres_changes',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
        onMessage: handleChatMessage,
        onError: handleConnectionError
      });
    },
    unsubscribeFromChat: (chatId: string, componentId: string) => {
      cleanup(`messages:${chatId}`);
    },
    subscribeToMessage: (messageId: string, componentId: string, onUpdate: (content: string) => void) => {
      subscribe({
        event: 'postgres_changes',
        schema: 'public',
        table: 'messages',
        filter: `id=eq.${messageId}`,
        onMessage: (payload) => handleMessageUpdate(payload, onUpdate),
        onError: handleConnectionError
      });
    },
    unsubscribeFromMessage: (messageId: string, componentId: string) => {
      cleanup(`messages:${messageId}`);
    },
    subscribe,
    cleanup
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};