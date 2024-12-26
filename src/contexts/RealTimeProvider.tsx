import React, { useState, useRef } from 'react';
import { RealTimeContext } from './RealTimeContext';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import { useRealtimeConnection } from '@/hooks/realtime/useRealtimeConnection';
import { useSubscriptionState } from '@/hooks/realtime/useSubscriptionState';
import { useMessageHandlers } from '@/hooks/realtime/useMessageHandlers';
import { subscriptionManager } from '@/utils/realtime/SubscriptionManager';
import { useConnectionStateManager } from './realtime/useConnectionStateManager';
import { ExponentialBackoff } from '@/utils/backoff';

const backoffConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: 5,
  jitter: true
};

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<Message>();
  const backoff = useRef(new ExponentialBackoff(backoffConfig));
  
  const { connectionState, handleConnectionError } = useConnectionStateManager(backoff);
  const { subscribe, cleanup, activeSubscriptions, getActiveSubscriptionCount } = useSubscriptionState();
  const { handleChatMessage, handleMessageUpdate } = useMessageHandlers(setLastMessage, backoff.current);

  // Monitor active subscriptions
  React.useEffect(() => {
    const interval = setInterval(() => {
      logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Active subscription count', {
        count: getActiveSubscriptionCount(),
        timestamp: new Date().toISOString()
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [getActiveSubscriptionCount]);

  const subscribeToChat = React.useCallback((chatId: string) => {
    const channel = subscribe({
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
      onMessage: handleChatMessage,
      onError: handleConnectionError,
      onSubscriptionStatus: (status) => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Chat subscription status changed', {
          chatId,
          status,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    subscriptionManager.addChannel(`messages-chat_id=eq.${chatId}`, channel);
  }, [subscribe, handleChatMessage, handleConnectionError]);

  const unsubscribeFromChat = React.useCallback((chatId: string) => {
    cleanup(`messages-chat_id=eq.${chatId}`);
    subscriptionManager.removeChannel(`messages-chat_id=eq.${chatId}`);
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Unsubscribed from chat', {
      chatId,
      timestamp: new Date().toISOString()
    });
  }, [cleanup]);

  const subscribeToMessage = React.useCallback((messageId: string, onUpdate: (content: string) => void) => {
    const channel = subscribe({
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `id=eq.${messageId}`,
      onMessage: handleMessageUpdate(messageId, onUpdate),
      onError: handleConnectionError,
      onSubscriptionStatus: (status) => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Message subscription status changed', {
          messageId,
          status,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    subscriptionManager.addChannel(`messages-id=eq.${messageId}`, channel);
  }, [subscribe, handleMessageUpdate, handleConnectionError]);

  const unsubscribeFromMessage = React.useCallback((messageId: string) => {
    cleanup(`messages-id=eq.${messageId}`);
    subscriptionManager.removeChannel(`messages-id=eq.${messageId}`);
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Unsubscribed from message', {
      messageId,
      timestamp: new Date().toISOString()
    });
  }, [cleanup]);

  React.useEffect(() => {
    return () => {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Cleaning up all subscriptions', {
        activeSubscriptions: Array.from(activeSubscriptions),
        timestamp: new Date().toISOString()
      });
      cleanup();
      subscriptionManager.cleanup();
    };
  }, [cleanup, activeSubscriptions]);

  const value = {
    connectionState,
    lastMessage,
    subscribeToChat,
    unsubscribeFromChat,
    subscribeToMessage,
    unsubscribeFromMessage,
    subscribe,
    cleanup
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};