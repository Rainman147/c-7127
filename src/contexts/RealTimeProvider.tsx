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
import type { RealtimeContextValue, SubscriptionConfig } from './realtime/types';
import type { CustomError, ConnectionError, SubscriptionError } from './realtime/types/errors';

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

  const handleWebSocketError = useCallback((error: CustomError) => {
    logger.error(LogCategory.WEBSOCKET, 'RealTimeProvider', 'WebSocket error occurred', {
      error,
      timestamp: new Date().toISOString()
    });

    const connectionError: ConnectionError = {
      name: 'ConnectionError',
      code: error.code || 0,
      reason: error.reason || 'Unknown error',
      timestamp: new Date().toISOString(),
      connectionState: 'error',
      retryCount: retryManager.getAttemptCount(),
      lastAttempt: Date.now(),
      backoffDelay: retryManager.getNextDelay() || 0,
      message: error.message
    };

    handleConnectionError(connectionError);
    
    if (retryManager.shouldRetry()) {
      const metadata = retryManager.getRetryMetadata();
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Initiating retry', {
        metadata,
        timestamp: new Date().toISOString()
      });
    }
  }, [handleConnectionError, retryManager]);

  const { lastPingTime } = useWebSocketManager(
    undefined,
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
      onError: (error: CustomError) => {
        const subscriptionError: SubscriptionError = {
          name: 'ChannelError',
          channelId: subscriptionKey,
          event: 'error',
          timestamp: new Date().toISOString(),
          connectionState: 'error',
          retryCount: retryManager.getAttemptCount(),
          lastAttempt: Date.now(),
          backoffDelay: retryManager.getNextDelay() || 0,
          reason: error.reason || 'Unknown error',
          message: error.message
        };
        handleConnectionError({
          ...subscriptionError,
          name: 'ConnectionError',
          code: 0
        } as ConnectionError);
      }
    });
    
    addSubscription({ 
      channelKey: subscriptionKey, 
      channel, 
      onError: handleWebSocketError 
    });
    
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Chat subscription created', {
      chatId,
      componentId,
      timestamp: new Date().toISOString()
    });
  }, [addSubscription, handleChatMessage, handleConnectionError, handleWebSocketError, subscriptionManagerSubscribe, retryManager]);

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
      onError: (error: CustomError) => {
        const subscriptionError: SubscriptionError = {
          name: 'ChannelError',
          channelId: subscriptionKey,
          event: 'error',
          timestamp: new Date().toISOString(),
          connectionState: 'error',
          retryCount: retryManager.getAttemptCount(),
          lastAttempt: Date.now(),
          backoffDelay: retryManager.getNextDelay() || 0,
          reason: error.reason || 'Unknown error',
          message: error.message
        };
        handleConnectionError({
          ...subscriptionError,
          name: 'ConnectionError',
          code: 0
        } as ConnectionError);
      }
    });
    
    addSubscription({ 
      channelKey: subscriptionKey, 
      channel, 
      onError: handleWebSocketError 
    });
    
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Message subscription created', {
      messageId,
      componentId,
      timestamp: new Date().toISOString()
    });
  }, [addSubscription, handleMessageUpdate, handleConnectionError, handleWebSocketError, subscriptionManagerSubscribe, retryManager]);

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
  }, [cleanupSubscriptions, retryManager, getActiveSubscriptions]);

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
