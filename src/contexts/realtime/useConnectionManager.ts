import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { getNextRetryDelay, retryConfig } from './config';
import type { ConnectionState } from './config';
import type { Message } from '@/types/chat';

export const useConnectionManager = (
  retryTimeouts: React.MutableRefObject<Map<string, NodeJS.Timeout>>,
  subscribeToChat: (chatId: string) => void
) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastAttempt: 0,
    retryCount: 0,
  });

  const handleConnectionError = useCallback((chatId: string, error: Error) => {
    logger.error(LogCategory.COMMUNICATION, 'RealTimeContext', 'Connection error:', {
      chatId,
      error,
      retryCount: connectionState.retryCount,
    });

    if (connectionState.retryCount < retryConfig.maxAttempts) {
      const nextRetryDelay = getNextRetryDelay(connectionState.retryCount);
      
      setConnectionState(prev => ({
        status: 'connecting',
        lastAttempt: Date.now(),
        retryCount: prev.retryCount + 1,
        error,
      }));

      if (retryTimeouts.current.has(chatId)) {
        clearTimeout(retryTimeouts.current.get(chatId));
      }

      const timeout = setTimeout(() => {
        subscribeToChat(chatId);
      }, nextRetryDelay);

      retryTimeouts.current.set(chatId, timeout);
      
      logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Scheduling retry:', {
        chatId,
        delay: nextRetryDelay,
        attempt: connectionState.retryCount + 1,
      });
    } else {
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected',
        error,
      }));
      
      logger.error(LogCategory.COMMUNICATION, 'RealTimeContext', 'Max retry attempts reached:', {
        chatId,
        maxAttempts: retryConfig.maxAttempts,
      });
    }
  }, [connectionState.retryCount, retryTimeouts, subscribeToChat]);

  return {
    connectionState,
    setConnectionState,
    handleConnectionError
  };
};