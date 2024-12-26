import React, { useState, useRef, useCallback } from 'react';
import { RealTimeContext } from './RealTimeContext';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import { useRealtimeConnection } from '@/hooks/realtime/useRealtimeConnection';
import { useSubscriptionState } from './realtime/useSubscriptionState';
import { useMessageHandlers } from './realtime/useSubscriptionHandlers';
import { subscriptionManager } from '@/utils/realtime/SubscriptionManager';
import { useConnectionStateManager } from './realtime/useConnectionStateManager';
import { ExponentialBackoff } from '@/utils/backoff';
import type { RealtimeContextValue } from './realtime/types';

const backoffConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: 5,
  jitter: true
};

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<Message>();
  const backoff = useRef(new ExponentialBackoff(backoffConfig));
  const activeSubscriptionsRef = useRef(new Map<string, { componentId: string; timestamp: number }>());
  
  const { connectionState, handleConnectionError } = useConnectionStateManager(backoff);
  const { subscribe, cleanup, activeSubscriptions, getActiveSubscriptionCount } = useSubscriptionState();
  const { handleChatMessage, handleMessageUpdate } = useMessageHandlers(setLastMessage, backoff.current);

  // Monitor active subscriptions and log metrics
  React.useEffect(() => {
    const interval = setInterval(() => {
      const subscriptionMetrics = {
        totalCount: getActiveSubscriptionCount(),
        byComponent: Array.from(activeSubscriptionsRef.current.entries()).reduce((acc, [key, value]) => {
          acc[value.componentId] = (acc[value.componentId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Subscription metrics', subscriptionMetrics);
    }, 60000);

    return () => clearInterval(interval);
  }, [getActiveSubscriptionCount]);

  const subscribeToChat = useCallback((chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    const existingSubscription = activeSubscriptionsRef.current.get(subscriptionKey);

    if (existingSubscription) {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Reusing existing chat subscription', {
        chatId,
        componentId,
        existingComponentId: existingSubscription.componentId
      });
      return;
    }

    const channel = subscribe({
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
      onMessage: handleChatMessage,
      onError: handleConnectionError
    });
    
    activeSubscriptionsRef.current.set(subscriptionKey, {
      componentId,
      timestamp: Date.now()
    });
    subscriptionManager.addChannel(subscriptionKey, channel);
  }, [subscribe, handleChatMessage, handleConnectionError]);

  const unsubscribeFromChat = useCallback((chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    const existingSubscription = activeSubscriptionsRef.current.get(subscriptionKey);

    if (existingSubscription?.componentId !== componentId) {
      logger.warn(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Subscription ownership mismatch', {
        chatId,
        requestingComponent: componentId,
        owningComponent: existingSubscription?.componentId
      });
      return;
    }

    cleanup(subscriptionKey);
    activeSubscriptionsRef.current.delete(subscriptionKey);
    subscriptionManager.removeChannel(subscriptionKey);
  }, [cleanup]);

  const subscribeToMessage = useCallback((messageId: string, componentId: string, onUpdate: (content: string) => void) => {
    const subscriptionKey = `messages-id=eq.${messageId}`;
    const existingSubscription = activeSubscriptionsRef.current.get(subscriptionKey);

    if (existingSubscription) {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Reusing existing message subscription', {
        messageId,
        componentId,
        existingComponentId: existingSubscription.componentId
      });
      return;
    }

    const channel = subscribe({
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `id=eq.${messageId}`,
      onMessage: handleMessageUpdate(messageId, onUpdate),
      onError: handleConnectionError
    });
    
    activeSubscriptionsRef.current.set(subscriptionKey, {
      componentId,
      timestamp: Date.now()
    });
    subscriptionManager.addChannel(subscriptionKey, channel);
  }, [subscribe, handleMessageUpdate, handleConnectionError]);

  const unsubscribeFromMessage = useCallback((messageId: string, componentId: string) => {
    const subscriptionKey = `messages-id=eq.${messageId}`;
    const existingSubscription = activeSubscriptionsRef.current.get(subscriptionKey);

    if (existingSubscription?.componentId !== componentId) {
      logger.warn(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Message subscription ownership mismatch', {
        messageId,
        requestingComponent: componentId,
        owningComponent: existingSubscription?.componentId
      });
      return;
    }

    cleanup(subscriptionKey);
    activeSubscriptionsRef.current.delete(subscriptionKey);
    subscriptionManager.removeChannel(subscriptionKey);
  }, [cleanup]);

  React.useEffect(() => {
    return () => {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Cleaning up all subscriptions');
      cleanup();
      subscriptionManager.cleanup();
      activeSubscriptionsRef.current.clear();
    };
  }, [cleanup]);

  const value: RealtimeContextValue = {
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