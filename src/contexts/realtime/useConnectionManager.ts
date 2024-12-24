import { useState, useCallback } from 'react';
import type { ConnectionState } from './config';
import { logger, LogCategory } from '@/utils/logging';

export const useConnectionManager = (
  retryTimeouts: React.MutableRefObject<Record<string, NodeJS.Timeout>>,
  subscribeToChat: (chatId: string) => void
) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastAttempt: 0,
    retryCount: 0
  });

  const handleConnectionError = useCallback((chatId: string, error: Error) => {
    logger.error(LogCategory.COMMUNICATION, 'ConnectionManager', 'Connection error:', {
      chatId,
      error,
      timestamp: new Date().toISOString()
    });

    setConnectionState(prev => ({
      status: 'error',
      lastAttempt: Date.now(),
      retryCount: prev.retryCount + 1
    }));

    if (retryTimeouts.current[chatId]) {
      clearTimeout(retryTimeouts.current[chatId]);
    }

    retryTimeouts.current[chatId] = setTimeout(
      () => subscribeToChat(chatId),
      Math.min(1000 * Math.pow(2, connectionState.retryCount), 30000)
    );
  }, [connectionState.retryCount, retryTimeouts, subscribeToChat]);

  return {
    connectionState,
    setConnectionState,
    handleConnectionError
  };
};