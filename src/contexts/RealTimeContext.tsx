import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { ErrorTracker } from '@/utils/errorTracking';
import { useSubscriptionManager } from './realtime/useSubscriptionManager';
import { useConnectionManager } from './realtime/useConnectionManager';
import type { Message } from '@/types/chat';
import type { RealTimeContextValue } from './realtime/config';

const RealTimeContext = createContext<RealTimeContextValue | undefined>(undefined);

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<Message>();
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const retryTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  
  const handleError = useCallback((error: Error, operation: string) => {
    logger.error(LogCategory.COMMUNICATION, 'RealTimeContext', `Error during ${operation}:`, {
      error,
      retryCount,
      timestamp: new Date().toISOString()
    });

    ErrorTracker.trackError(error, {
      component: 'RealTimeContext',
      severity: retryCount >= MAX_RETRIES ? 'high' : 'medium',
      timestamp: new Date().toISOString(),
      operation,
      additionalInfo: {
        activeSubscriptions: Array.from(activeSubscriptions.current)
      }
    });

    if (retryCount < MAX_RETRIES) {
      toast({
        title: "Connection Issue",
        description: `Attempting to reconnect... (${retryCount + 1}/${MAX_RETRIES})`,
        variant: "default",
      });
    } else {
      toast({
        title: "Connection Error",
        description: "Unable to establish connection. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [retryCount, toast]);

  const {
    channels,
    activeSubscriptions,
    cleanupSubscription,
    cleanupAllSubscriptions
  } = useSubscriptionManager(setLastMessage);

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
            try {
              logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Received message:', { 
                payload,
                chatId,
                eventType: payload.eventType,
                timestamp: new Date().toISOString()
              });
              
              if (payload.eventType === 'INSERT') {
                const newMessage = payload.new as Message;
                
                if (lastMessage?.id !== newMessage.id) {
                  logger.debug(LogCategory.STATE, 'RealTimeContext', 'Setting new last message:', {
                    messageId: newMessage.id,
                    previousMessageId: lastMessage?.id
                  });
                  setLastMessage(newMessage);
                  setRetryCount(0); // Reset retry count on successful message
                } else {
                  logger.debug(LogCategory.STATE, 'RealTimeContext', 'Skipping duplicate message:', {
                    messageId: newMessage.id
                  });
                }
              }
            } catch (error) {
              handleError(error as Error, 'process message payload');
            }
          }
        )
        .subscribe(status => {
          try {
            logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Subscription status changed:', {
              chatId,
              status,
              timestamp: new Date().toISOString(),
              retryCount
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
                timestamp: new Date().toISOString()
              });
            } else if (status === 'CHANNEL_ERROR') {
              handleConnectionError(chatId, new Error(`Failed to subscribe to chat ${chatId}`));
            }
          } catch (error) {
            handleError(error as Error, 'handle subscription status');
          }
        });
    } catch (error) {
      handleError(error as Error, 'subscribe to chat');
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => subscribeToChat(chatId), Math.pow(2, retryCount) * 1000);
      }
    }
  }, [lastMessage, handleError, retryCount]);

  const {
    connectionState,
    setConnectionState,
    handleConnectionError
  } = useConnectionManager(retryTimeouts, subscribeToChat);

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

  useEffect(() => {
    return () => {
      try {
        cleanupAllSubscriptions();
      } catch (error) {
        handleError(error as Error, 'cleanup all subscriptions');
      }
    };
  }, [cleanupAllSubscriptions, handleError]);

  const value: RealTimeContextValue = {
    connectionState,
    subscribeToChat,
    unsubscribeFromChat,
    activeSubscriptions: activeSubscriptions.current,
    lastMessage,
    retryCount
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
