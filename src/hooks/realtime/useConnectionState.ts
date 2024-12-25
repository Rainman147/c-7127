import { useState, useCallback, useRef, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';
import type { ConnectionState } from '@/contexts/realtime/config';

const INITIAL_STATE: ConnectionState = {
  status: 'connecting',
  lastAttempt: Date.now(),
  retryCount: 0,
  error: undefined
};

export const useConnectionState = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(INITIAL_STATE);
  const { toast } = useToast();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced state update to prevent rapid changes
  const debouncedSetState = useCallback(
    debounce((newState: ConnectionState) => {
      logger.info(LogCategory.STATE, 'ConnectionState', 'State transition', {
        from: connectionState.status,
        to: newState.status,
        retryCount: newState.retryCount,
        timestamp: new Date().toISOString()
      });

      setConnectionState(newState);

      // Show toast notification for state changes
      if (newState.status === 'connected' && connectionState.status !== 'connected') {
        toast({
          description: "Connection restored",
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

  const handleConnectionSuccess = useCallback(() => {
    logger.info(LogCategory.COMMUNICATION, 'ConnectionState', 'Connection successful', {
      previousState: connectionState.status,
      timestamp: new Date().toISOString()
    });

    debouncedSetState({
      status: 'connected',
      lastAttempt: Date.now(),
      retryCount: 0,
      error: undefined
    });
  }, [debouncedSetState]);

  const handleConnectionError = useCallback((error: Error) => {
    logger.error(LogCategory.ERROR, 'ConnectionState', 'Connection error', {
      error: error.message,
      retryCount: connectionState.retryCount,
      timestamp: new Date().toISOString()
    });

    debouncedSetState({
      status: 'disconnected',
      lastAttempt: Date.now(),
      retryCount: connectionState.retryCount + 1,
      error
    });
  }, [connectionState.retryCount, debouncedSetState]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      debouncedSetState.cancel();
    };
  }, [debouncedSetState]);

  return {
    connectionState,
    handleConnectionSuccess,
    handleConnectionError
  };
};