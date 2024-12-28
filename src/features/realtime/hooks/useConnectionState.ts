import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { ConnectionState } from '../types';

export const useConnectionState = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now()
  });

  const handleConnectionSuccess = useCallback(() => {
    logger.info(LogCategory.WEBSOCKET, 'ConnectionState', 'Connection successful', {
      timestamp: new Date().toISOString()
    });
    
    setConnectionState({
      status: 'connected',
      retryCount: 0,
      lastAttempt: Date.now()
    });
  }, []);

  const handleConnectionError = useCallback((error: Error) => {
    logger.error(LogCategory.WEBSOCKET, 'ConnectionState', 'Connection error:', {
      error,
      retryCount: connectionState.retryCount + 1,
      timestamp: new Date().toISOString()
    });

    setConnectionState(prev => ({
      status: 'disconnected',
      retryCount: prev.retryCount + 1,
      error,
      lastAttempt: Date.now()
    }));
  }, [connectionState.retryCount]);

  return {
    connectionState,
    handleConnectionSuccess,
    handleConnectionError
  };
};