import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';
import type { ConnectionState } from '@/contexts/realtime/types';
import type { ExponentialBackoff } from '@/utils/backoff';

export const useConnectionStateManager = (backoff: React.MutableRefObject<ExponentialBackoff>) => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now(),
    error: undefined
  });

  const handleConnectionError = useCallback((error: Error) => {
    logger.error(LogCategory.WEBSOCKET, 'ConnectionStateManager', 'Connection error occurred', {
      error: error.message,
      retryCount: backoff.current.attemptCount,
      lastAttempt: connectionState.lastAttempt,
      timeSinceLastAttempt: Date.now() - connectionState.lastAttempt,
      timestamp: new Date().toISOString()
    });

    const delay = backoff.current.nextDelay();
    if (delay !== null) {
      setConnectionState(prev => {
        const newState = {
          status: 'disconnected' as const,
          retryCount: prev.retryCount + 1,
          lastAttempt: Date.now(),
          error
        };

        logger.info(LogCategory.WEBSOCKET, 'ConnectionStateManager', 'Updating connection state', {
          previousState: prev,
          newState,
          delay,
          timestamp: new Date().toISOString()
        });

        return newState;
      });

      toast({
        title: "Connection Lost",
        description: `Reconnecting in ${Math.round(delay / 1000)}s... (Attempt ${backoff.current.attemptCount}/5)`,
        variant: "destructive",
      });
    } else {
      logger.error(LogCategory.WEBSOCKET, 'ConnectionStateManager', 'Maximum retry attempts reached', {
        totalAttempts: backoff.current.attemptCount,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Connection Failed",
        description: "Maximum retry attempts reached. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [connectionState.lastAttempt, toast]);

  const debouncedSetState = useCallback(
    debounce((newState: ConnectionState) => {
      logger.info(LogCategory.WEBSOCKET, 'ConnectionStateManager', 'Debounced state update', {
        currentState: connectionState,
        newState,
        timestamp: new Date().toISOString()
      });

      setConnectionState(newState);
    }, 300),
    [connectionState]
  );

  return {
    connectionState,
    setConnectionState: debouncedSetState,
    handleConnectionError
  };
};