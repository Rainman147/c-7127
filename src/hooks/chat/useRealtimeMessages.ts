import { useEffect, useCallback, useState } from 'react';
import { useRealTime } from '@/contexts/RealTimeContext';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { ErrorTracker } from '@/utils/errorTracking';
import type { Message } from '@/types/chat';

export const useRealtimeMessages = (
  chatId: string | null,
  onMessageReceived: (message: Message) => void
) => {
  const { subscribeToChat, unsubscribeFromChat, connectionState, lastMessage } = useRealTime();
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const handleError = useCallback((error: Error, operation: string) => {
    logger.error(LogCategory.COMMUNICATION, 'useRealtimeMessages', `Error during ${operation}:`, {
      error,
      chatId,
      connectionState,
      retryCount,
      timestamp: new Date().toISOString()
    });

    ErrorTracker.trackError(error, {
      component: 'useRealtimeMessages',
      severity: retryCount >= MAX_RETRIES ? 'high' : 'medium',
      timestamp: new Date().toISOString(),
      errorType: error.name,
      operation,
      additionalInfo: {
        chatId,
        connectionState: connectionState.status
      }
    });

    if (retryCount < MAX_RETRIES) {
      toast({
        title: "Connection Issue",
        description: `Attempting to reconnect... (${retryCount + 1}/${MAX_RETRIES})`,
        variant: "default",
      });
      setRetryCount(prev => prev + 1);
    } else {
      toast({
        title: "Connection Error",
        description: "Unable to establish connection. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [chatId, connectionState, retryCount, toast]);

  useEffect(() => {
    if (!chatId) {
      logger.debug(LogCategory.COMMUNICATION, 'useRealtimeMessages', 'No chat ID provided');
      return;
    }

    try {
      subscribeToChat(chatId);
      setRetryCount(0);
    } catch (error) {
      handleError(error as Error, 'subscribe');
    }

    return () => {
      try {
        unsubscribeFromChat(chatId);
      } catch (error) {
        handleError(error as Error, 'unsubscribe');
      }
    };
  }, [chatId, subscribeToChat, unsubscribeFromChat, handleError]);

  useEffect(() => {
    if (lastMessage) {
      try {
        onMessageReceived(lastMessage);
      } catch (error) {
        handleError(error as Error, 'process message');
      }
    }
  }, [lastMessage, onMessageReceived, handleError]);

  return {
    connectionState,
    retryCount
  };
};