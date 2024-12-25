import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useSubscriptionManager } from './realtime/useSubscriptionManager';
import { useConnectionManager } from './realtime/useConnectionManager';
import { useErrorHandler } from './realtime/useErrorHandler';
import { debounce } from 'lodash';
import type { Message } from '@/types/chat';
import type { RealTimeContextValue } from './realtime/config';

const RealTimeContext = createContext<RealTimeContextValue | undefined>(undefined);

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<Message>();
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const activeSubscriptions = useRef(new Set<string>());
  const channels = useRef(new Map());
  const reconnectAttempts = useRef(0);

  const {
    connectionState,
    setConnectionState,
    handleConnectionError
  } = useConnectionManager(retryTimeouts);

  const handleError = useErrorHandler(retryCount, activeSubscriptions);

  const {
    cleanupSubscription,
    cleanupAllSubscriptions,
    processMessage
  } = useSubscriptionManager(setLastMessage, setConnectionState, handleConnectionError, lastMessage);

  // Debounced connection state update
  const debouncedSetConnectionState = useCallback(
    debounce((newState) => {
      logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Connection state change:', {
        from: connectionState.status,
        to: newState.status,
        retryCount: newState.retryCount,
        timestamp: new Date().toISOString()
      });
      setConnectionState(newState);
    }, 300),
    [connectionState.status, setConnectionState]
  );

  // Exponential backoff for reconnection
  const getReconnectDelay = useCallback(() => {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.current), maxDelay);
    logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Calculating reconnect delay:', {
      attempt: reconnectAttempts.current,
      delay,
      timestamp: new Date().toISOString()
    });
    return delay;
  }, []);

  const handleReconnect = useCallback(() => {
    if (connectionState.status === 'disconnected') {
      const delay = getReconnectDelay();
      logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Attempting reconnection:', {
        attempt: reconnectAttempts.current + 1,
        delay,
        timestamp: new Date().toISOString()
      });

      retryTimeouts.current.reconnect = setTimeout(() => {
        reconnectAttempts.current += 1;
        debouncedSetConnectionState({
          status: 'connecting',
          lastAttempt: Date.now(),
          retryCount: reconnectAttempts.current
        });
        
        // Re-establish all active subscriptions
        activeSubscriptions.current.forEach(chatId => {
          subscribeToChat(chatId);
        });
      }, delay);
    }
  }, [connectionState.status, debouncedSetConnectionState, getReconnectDelay]);

  const subscribeToChat = useCallback((chatId: string) => {
    try {
      logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Subscribing to chat:', { 
        chatId,
        activeSubscriptions: Array.from(activeSubscriptions.current),
        timestamp: new Date().toISOString()
      });

      if (channels.current.has(chatId)) {
        logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Already subscribed to chat:', { 
          chatId,
          timestamp: new Date().toISOString()
        });
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
          (payload) => processMessage(payload, chatId)
        )
        .subscribe(status => {
          try {
            logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Subscription status changed:', {
              chatId,
              status,
              timestamp: new Date().toISOString(),
              retryCount: reconnectAttempts.current
            });

            if (status === 'SUBSCRIBED') {
              activeSubscriptions.current.add(chatId);
              channels.current.set(chatId, channel);
              reconnectAttempts.current = 0;
              debouncedSetConnectionState({
                status: 'connected',
                lastAttempt: Date.now(),
                retryCount: 0,
              });
              
              logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Successfully subscribed to chat:', {
                chatId,
                activeSubscriptions: Array.from(activeSubscriptions.current),
                timestamp: new Date().toISOString()
              });
            } else if (status === 'CHANNEL_ERROR') {
              handleConnectionError(chatId, new Error(`Failed to subscribe to chat ${chatId}`));
              handleReconnect();
            }
          } catch (error) {
            handleError(error as Error, 'handle subscription status');
          }
        });

    } catch (error) {
      handleError(error as Error, 'subscribe to chat');
      if (reconnectAttempts.current < 5) {
        handleReconnect();
      }
    }
  }, [debouncedSetConnectionState, handleConnectionError, handleError, handleReconnect, processMessage]);

  const unsubscribeFromChat = useCallback((chatId: string) => {
    try {
      logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Unsubscribing from chat:', { 
        chatId,
        activeSubscriptions: Array.from(activeSubscriptions.current),
        timestamp: new Date().toISOString()
      });
      cleanupSubscription(chatId);
    } catch (error) {
      handleError(error as Error, 'unsubscribe from chat');
    }
  }, [cleanupSubscription, handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        Object.values(retryTimeouts.current).forEach(clearTimeout);
        cleanupAllSubscriptions();
        debouncedSetConnectionState.cancel();
      } catch (error) {
        handleError(error as Error, 'cleanup on unmount');
      }
    };
  }, [cleanupAllSubscriptions, debouncedSetConnectionState, handleError]);

  const value: RealTimeContextValue = {
    connectionState,
    subscribeToChat,
    unsubscribeFromChat,
    activeSubscriptions: activeSubscriptions.current,
    lastMessage,
    retryCount: reconnectAttempts.current
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