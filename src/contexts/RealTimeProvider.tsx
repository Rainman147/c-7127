import React, { useState, useCallback } from 'react';
import { RealTimeContext } from './RealTimeContext';
import { logger, LogCategory } from '@/utils/logging';
import { useWebSocketManager } from './realtime/WebSocketManager';
import { useSubscriptionManager } from './realtime/SubscriptionManager';
import { useConnectionStateManager } from './realtime/ConnectionStateManager';
import { useRetryManager } from './realtime/RetryManager';
import { useMessageHandlers } from '@/hooks/realtime/useMessageHandlers';
import { ExponentialBackoff } from '@/utils/backoff';
import type { Message } from '@/types/chat';
import type { RealtimeContextValue } from './realtime/types';
import type { SubscriptionConfig } from './realtime/types';

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<Message>();
  const backoff = new ExponentialBackoff();
  
  const {
    connectionState,
    setConnectionState,
    handleConnectionError
  } = useConnectionStateManager();

  const {
    subscribe: subscriptionManagerSubscribe,
    addSubscription,
    removeSubscription,
    cleanup: cleanupSubscriptions,
    getActiveSubscriptions
  } = useSubscriptionManager();

  const retryManager = useRetryManager();

  const { handleChatMessage, handleMessageUpdate } = useMessageHandlers(
    setLastMessage,
    backoff
  );

  const handleWebSocketError = useCallback((error: any) => {
    handleConnectionError(error);
    if (retryManager.shouldRetry()) {
      const metadata = retryManager.getRetryMetadata();
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Initiating retry', {
        metadata,
        timestamp: new Date().toISOString()
      });
    }
  }, [handleConnectionError, retryManager]);

  const { lastPingTime } = useWebSocketManager(
    undefined, // Initial channel - will be set when subscriptions are added
    handleWebSocketError
  );

  const subscribeToChat = useCallback((chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    const channel = subscriptionManagerSubscribe({
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
      onMessage: handleChatMessage,
      onError: handleConnectionError
    });
    
    addSubscription({ channelKey: subscriptionKey, channel, onError: handleWebSocketError });
    
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Chat subscription created', {
      chatId,
      componentId,
      timestamp: new Date().toISOString()
    });
  }, [addSubscription, handleChatMessage, handleConnectionError, handleWebSocketError, subscriptionManagerSubscribe]);

  const unsubscribeFromChat = useCallback((chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    removeSubscription(subscriptionKey);
  }, [removeSubscription]);

  const subscribeToMessage = useCallback((messageId: string, componentId: string, onUpdate: (content: string) => void) => {
    const subscriptionKey = `messages-id=eq.${messageId}`;
    const channel = subscriptionManagerSubscribe({
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `id=eq.${messageId}`,
      onMessage: handleMessageUpdate(messageId, onUpdate),
      onError: handleConnectionError
    });
    
    addSubscription({ channelKey: subscriptionKey, channel, onError: handleWebSocketError });
    
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Message subscription created', {
      messageId,
      componentId,
      timestamp: new Date().toISOString()
    });
  }, [addSubscription, handleMessageUpdate, handleConnectionError, handleWebSocketError, subscriptionManagerSubscribe]);

  const unsubscribeFromMessage = useCallback((messageId: string, componentId: string) => {
    const subscriptionKey = `messages-id=eq.${messageId}`;
    removeSubscription(subscriptionKey);
  }, [removeSubscription]);

  React.useEffect(() => {
    return () => {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Cleaning up all subscriptions', {
        activeSubscriptions: getActiveSubscriptions().length,
        timestamp: new Date().toISOString()
      });
      cleanupSubscriptions();
      retryManager.reset();
    };
  }, [cleanupSubscriptions, retryManager]);

  const value: RealtimeContextValue = {
    connectionState,
    lastMessage,
    subscribeToChat,
    unsubscribeFromChat,
    subscribeToMessage,
    unsubscribeFromMessage,
    subscribe: subscriptionManagerSubscribe,
    cleanup: cleanupSubscriptions
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};