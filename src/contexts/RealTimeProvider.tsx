import React, { useRef, useState, useEffect } from 'react';
import { RealTimeContext } from './RealTimeContext';
import { ExponentialBackoff } from '@/utils/backoff';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import { useConnectionStateManager } from './realtime/useConnectionStateManager';
import { useSubscriptionHandlers } from './realtime/useSubscriptionHandlers';
import { useSubscriptionManager } from './realtime/useSubscriptionManager';

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
  const { subscribe, cleanup, activeSubscriptions, getActiveSubscriptionCount } = useSubscriptionManager();
  const { handleChatMessage, handleMessageUpdate } = useSubscriptionHandlers(setLastMessage, backoff);

  // Monitor active subscriptions
  useEffect(() => {
    const interval = setInterval(() => {
      logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Active subscription count', {
        count: getActiveSubscriptionCount(),
        timestamp: new Date().toISOString()
      });
    }, 60000); // Log every minute

    return () => clearInterval(interval);
  }, [getActiveSubscriptionCount]);

  const subscribeToChat = (chatId: string) => {
    subscribe({
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
  };

  const unsubscribeFromChat = (chatId: string) => {
    cleanup(`messages-chat_id=eq.${chatId}`);
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Unsubscribed from chat', {
      chatId,
      timestamp: new Date().toISOString()
    });
  };

  const subscribeToMessage = (messageId: string, onUpdate: (content: string) => void) => {
    subscribe({
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
  };

  const unsubscribeFromMessage = (messageId: string) => {
    cleanup(`messages-id=eq.${messageId}`);
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Unsubscribed from message', {
      messageId,
      timestamp: new Date().toISOString()
    });
  };

  React.useEffect(() => {
    return () => {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Cleaning up all subscriptions', {
        activeSubscriptions: Array.from(activeSubscriptions),
        timestamp: new Date().toISOString()
      });
      cleanup();
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