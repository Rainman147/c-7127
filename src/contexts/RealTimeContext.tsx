import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useConnectionState } from './realtime/useConnectionState';
import { useRealtimeSync } from './realtime/useRealtimeSync';
import type { RealTimeContextValue } from './realtime/config';
import type { Message } from '@/types/chat';

const RealTimeContext = createContext<RealTimeContextValue | undefined>(undefined);

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { connectionState, updateConnectionState } = useConnectionState();
  const { currentChannel } = useRealtimeSync(connectionState, updateConnectionState);
  const [lastMessage, setLastMessage] = useState<Message>();
  const activeSubscriptions = useRef(new Set<string>());
  const channels = useRef(new Map());

  logger.debug(LogCategory.LIFECYCLE, 'RealTimeContext', 'Provider rendered', {
    connectionState,
    hasChannel: !!currentChannel,
    activeSubscriptions: Array.from(activeSubscriptions.current)
  });

  const subscribeToChat = useCallback((chatId: string) => {
    logger.debug(LogCategory.WEBSOCKET, 'RealTimeContext', 'Subscribing to chat', { chatId });
    
    if (channels.current.has(chatId)) {
      logger.debug(LogCategory.WEBSOCKET, 'RealTimeContext', 'Already subscribed to chat', { chatId });
      return;
    }

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          logger.debug(LogCategory.WEBSOCKET, 'RealTimeContext', 'Received message', {
            chatId,
            eventType: payload.eventType,
            timestamp: new Date().toISOString()
          });

          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            setLastMessage(newMessage);
          }
        }
      )
      .subscribe(status => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Subscription status changed', {
          chatId,
          status,
          timestamp: new Date().toISOString()
        });

        if (status === 'SUBSCRIBED') {
          activeSubscriptions.current.add(chatId);
          channels.current.set(chatId, channel);
          updateConnectionState({
            status: 'connected',
            retryCount: 0,
            error: undefined
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          updateConnectionState({
            status: 'disconnected',
            error: new Error(`Channel ${status} for chat ${chatId}`)
          });
        }
      });
  }, [updateConnectionState]);

  const unsubscribeFromChat = useCallback((chatId: string) => {
    logger.debug(LogCategory.WEBSOCKET, 'RealTimeContext', 'Unsubscribing from chat', { chatId });
    
    const channel = channels.current.get(chatId);
    if (channel) {
      supabase.removeChannel(channel);
      channels.current.delete(chatId);
      activeSubscriptions.current.delete(chatId);
      
      logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Unsubscribed from chat', {
        chatId,
        remainingSubscriptions: Array.from(activeSubscriptions.current),
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const value: RealTimeContextValue = {
    connectionState,
    subscribeToChat,
    unsubscribeFromChat,
    activeSubscriptions: activeSubscriptions.current,
    lastMessage,
    retryCount: connectionState.retryCount
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    logger.error(LogCategory.ERROR, 'RealTimeContext', 'useRealTime must be used within a RealTimeProvider');
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};