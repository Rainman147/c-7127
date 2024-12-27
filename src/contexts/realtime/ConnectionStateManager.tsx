import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';
import type { ConnectionError } from './types/errors';
import type { ConnectionState } from './types';

export const useConnectionStateManager = () => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now(),
    error: undefined
  });

  const debouncedSetState = useCallback(
    debounce((newState: ConnectionState) => {
      logger.info(LogCategory.WEBSOCKET, 'ConnectionStateManager', 'State transition', {
        from: connectionState.status,
        to: newState.status,
        retryCount: newState.retryCount,
        timestamp: new Date().toISOString()
      });

      setConnectionState(newState);

      if (newState.status === 'connected' && connectionState.status !== 'connected') {
        toast({
          description: "Connected to chat service",
          className: "bg-green-500 text-white",
        });
      } else if (newState.status === 'disconnected' && connectionState.status !== 'disconnected') {
        toast({
          title: "Connection Lost",
          description: `Reconnecting... (Attempt ${newState.retryCount}/5)`,
          variant: "destructive",
        });
      }
    }, 300),
    [connectionState.status, toast]
  );

  const handleConnectionError = useCallback((error: ConnectionError) => {
    logger.error(LogCategory.WEBSOCKET, 'ConnectionStateManager', 'Connection error occurred', {
      error,
      timestamp: new Date().toISOString()
    });

    debouncedSetState({
      status: 'disconnected',
      retryCount: connectionState.retryCount + 1,
      lastAttempt: Date.now(),
      error: new Error(error.reason || 'Unknown connection error')
    });
  }, [connectionState.retryCount, debouncedSetState]);

  return {
    connectionState,
    setConnectionState: debouncedSetState,
    handleConnectionError
  };
};