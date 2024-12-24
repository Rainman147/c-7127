import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { ConnectionState } from './config';

export const useConnectionManager = (
  retryTimeouts: React.MutableRefObject<Record<string, NodeJS.Timeout>>,
  subscribeToChat: (chatId: string) => void
) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastAttempt: 0,
    retryCount: 0,
    error: undefined
  });

  const handleConnectionError = useCallback((chatId: string, error: Error) => {
    logger.error(LogCategory.COMMUNICATION, 'ConnectionManager', 'Connection error:', {
      chatId,
      error,
      timestamp: new Date().toISOString()
    });

    setConnectionState(prev => ({
      status: 'disconnected',
      lastAttempt: Date.now(),
      retryCount: prev.retryCount + 1,
      error
    }));

    const timeoutKey = `retry-${chatId}`;
    if (retryTimeouts.current[timeoutKey]) {
      clearTimeout(retryTimeouts.current[timeoutKey]);
    }

    retryTimeouts.current[timeoutKey] = setTimeout(
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