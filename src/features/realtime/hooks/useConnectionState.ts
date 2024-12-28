import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { ConnectionError } from '../types/errors';

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected';
  retryCount: number;
  lastAttempt: number;
  error?: Error;
}

export const useConnectionState = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now()
  });

  const handleConnectionSuccess = useCallback(() => {
    setConnectionState({
      status: 'connected',
      retryCount: 0,
      lastAttempt: Date.now()
    });
    
    logger.info(LogCategory.WEBSOCKET, 'ConnectionState', 'Connection established', {
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleConnectionError = useCallback((error: ConnectionError) => {
    setConnectionState(prev => ({
      status: 'disconnected',
      retryCount: prev.retryCount + 1,
      lastAttempt: Date.now(),
      error: new Error(error.reason || 'Unknown connection error')
    }));

    logger.error(LogCategory.WEBSOCKET, 'ConnectionState', 'Connection error:', {
      error,
      retryCount: connectionState.retryCount + 1,
      timestamp: new Date().toISOString()
    });
  }, [connectionState.retryCount]);

  return {
    connectionState,
    handleConnectionSuccess,
    handleConnectionError
  };
};