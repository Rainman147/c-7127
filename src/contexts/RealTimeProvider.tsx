import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';
import { RealTimeContext } from './RealTimeContext';
import { useSubscriptionManager } from './realtime/useSubscriptionManager';
import { useSubscriptionHandlers } from './realtime/useSubscriptionHandlers';
import { ExponentialBackoff } from '@/utils/backoff';
import { useRef, useState } from 'react';
import type { Message } from '@/types/chat';
import type { ConnectionStatus } from './realtime/types';

const backoffConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: 5,
  jitter: true
};

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [lastMessage, setLastMessage] = useState<Message>();
  const backoff = useRef(new ExponentialBackoff(backoffConfig));
  const [connectionState, setConnectionState] = useState<{
    status: ConnectionStatus;
    retryCount: number;
    lastAttempt: number;
  }>({
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now()
  });
  
  const handleConnectionError = (error: Error) => {
    logger.error(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Connection error occurred', {
      error: error.message,
      retryCount: backoff.current.attemptCount,
      timestamp: new Date().toISOString()
    });

    const delay = backoff.current.nextDelay();
    if (delay !== null) {
      setConnectionState(prev => ({
        status: 'disconnected',
        retryCount: prev.retryCount + 1,
        lastAttempt: Date.now()
      }));

      toast({
        title: "Connection Lost",
        description: `Reconnecting... (Attempt ${backoff.current.attemptCount}/${backoffConfig.maxAttempts})`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connection Failed",
        description: "Maximum retry attempts reached. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const { subscribe, cleanup, activeSubscriptions } = useSubscriptionManager();
  const { handleChatMessage, handleMessageUpdate } = useSubscriptionHandlers(setLastMessage, backoff);

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

        if (status === 'SUBSCRIBED') {
          setConnectionState({
            status: 'connected',
            retryCount: 0,
            lastAttempt: Date.now()
          });
          backoff.current.reset();
        }
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
  }, [cleanup]);

  const value = {
    connectionState,
    lastMessage,
    subscribeToChat,
    unsubscribeFromChat,
    subscribeToMessage,
    unsubscribeFromMessage
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};