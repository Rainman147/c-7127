import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RealTimeContext } from './RealTimeContext';
import { logger, LogCategory } from '@/utils/logging';
import { useWebSocketManager } from './realtime/WebSocketManager';
import { useSubscriptionManager } from './realtime/SubscriptionManager';
import { useRetryManager } from './realtime/RetryManager';
import { useMessageHandlers } from '@/hooks/realtime/useMessageHandlers';
import { ConnectionManager } from './realtime/ConnectionManager';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';
import type { RealtimeContextValue, SubscriptionConfig } from './realtime/types';
import type { CustomError, ConnectionError } from './realtime/types/errors';

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<Message>();
  const { toast } = useToast();
  const connectionManager = useRef(new ConnectionManager());
  
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
    retryManager.backoff
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

    connectionManager.current.updateConnectionState({
      status: 'disconnected',
      error: connectionError,
      retryCount: connectionManager.current.getConnectionState().retryCount + 1
    });

    toast({
      title: "Connection Lost",
      description: `Attempting to reconnect... (Attempt ${retryManager.getAttemptCount()}/5)`,
      variant: "destructive",
    });
  }, [retryManager, toast]);

  const { lastPingTime } = useWebSocketManager(
    undefined,
    handleWebSocketError
  );

  const subscribeToChat = useCallback((chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    const config: SubscriptionConfig = {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
      onMessage: handleChatMessage,
      onError: handleWebSocketError,
      onSubscriptionStatus: (status) => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Chat subscription status changed', {
          chatId,
          status,
          timestamp: new Date().toISOString()
        });
      }
    };

    connectionManager.current.queueSubscription(config);
    
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Chat subscription queued', {
      chatId,
      componentId,
      timestamp: new Date().toISOString()
    });
  }, [handleChatMessage, handleWebSocketError]);

  const unsubscribeFromChat = useCallback((chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    removeSubscription(subscriptionKey);
  }, [removeSubscription]);

  const subscribeToMessage = useCallback((messageId: string, componentId: string, onUpdate: (content: string) => void) => {
    const subscriptionKey = `messages-id=eq.${messageId}`;
    const config: SubscriptionConfig = {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `id=eq.${messageId}`,
      onMessage: handleMessageUpdate(messageId, onUpdate),
      onError: handleWebSocketError,
      onSubscriptionStatus: (status) => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Message subscription status changed', {
          messageId,
          status,
          timestamp: new Date().toISOString()
        });
      }
    };

    connectionManager.current.queueSubscription(config);
    
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Message subscription queued', {
      messageId,
      componentId,
      timestamp: new Date().toISOString()
    });
  }, [handleMessageUpdate, handleWebSocketError]);

  const unsubscribeFromMessage = useCallback((messageId: string, componentId: string) => {
    const subscriptionKey = `messages-id=eq.${messageId}`;
    removeSubscription(subscriptionKey);
  }, [removeSubscription]);

  useEffect(() => {
    return () => {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Cleaning up all subscriptions', {
        activeSubscriptions: getActiveSubscriptions().length,
        timestamp: new Date().toISOString()
      });
      cleanupSubscriptions();
      retryManager.reset();
      connectionManager.current.clearQueue();
    };
  }, [cleanupSubscriptions, retryManager, getActiveSubscriptions]);

  const value: RealtimeContextValue = {
    connectionState: connectionManager.current.getConnectionState(),
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
