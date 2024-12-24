import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useSubscriptionManager } from './realtime/useSubscriptionManager';
import { useConnectionManager } from './realtime/useConnectionManager';
import type { Message } from '@/types/chat';
import type { RealTimeContextValue, ConnectionState } from './realtime/config';

const RealTimeContext = createContext<RealTimeContextValue | undefined>(undefined);

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<Message>();
  
  const {
    channels,
    retryTimeouts,
    activeSubscriptions,
    cleanupSubscription,
    cleanupAllSubscriptions
  } = useSubscriptionManager(setLastMessage);

  const subscribeToChat = useCallback((chatId: string) => {
    logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Subscribing to chat:', { 
      chatId,
      activeSubscriptions: Array.from(activeSubscriptions.current),
    });

    if (channels.current.has(chatId)) {
      logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Already subscribed to chat:', { chatId });
      return;
    }

    setConnectionState(prev => ({
      ...prev,
      status: 'connecting',
      lastAttempt: Date.now(),
    }));

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
          logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Received message:', { 
            payload,
            chatId 
          });
          
          if (payload.eventType === 'INSERT') {
            setLastMessage(payload.new as Message);
          }
        }
      )
      .subscribe(status => {
        logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Subscription status changed:', {
          chatId,
          status,
        });

        if (status === 'SUBSCRIBED') {
          activeSubscriptions.current.add(chatId);
          channels.current.set(chatId, channel);
          setConnectionState({
            status: 'connected',
            lastAttempt: Date.now(),
            retryCount: 0,
          });
          
          logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Successfully subscribed to chat:', {
            chatId,
            activeSubscriptions: Array.from(activeSubscriptions.current),
          });
        } else if (status === 'CHANNEL_ERROR') {
          handleConnectionError(chatId, new Error(`Failed to subscribe to chat ${chatId}`));
        }
      });
  }, []);

  const {
    connectionState,
    setConnectionState,
    handleConnectionError
  } = useConnectionManager(retryTimeouts, subscribeToChat);

  const unsubscribeFromChat = useCallback((chatId: string) => {
    logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Unsubscribing from chat:', { 
      chatId,
      activeSubscriptions: Array.from(activeSubscriptions.current),
    });
    cleanupSubscription(chatId);
  }, [cleanupSubscription]);

  useEffect(() => {
    return cleanupAllSubscriptions;
  }, [cleanupAllSubscriptions]);

  const value: RealTimeContextValue = {
    connectionState,
    subscribeToChat,
    unsubscribeFromChat,
    activeSubscriptions: activeSubscriptions.current,
    lastMessage,
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