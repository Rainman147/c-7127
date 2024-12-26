import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import type { ConnectionStatus } from './types';

export const useConnectionStateManager = (backoff: React.MutableRefObject<ExponentialBackoff>) => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<{
    status: ConnectionStatus;
    retryCount: number;
    lastAttempt: number;
  }>({
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now()
  });

  const handleConnectionError = useCallback((error: Error) => {
    logger.error(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Connection error occurred', {
      error: error.message,
      retryCount: backoff.current.attemptCount,
      timestamp: new Date().toISOString()
    });

    const delay = backoff.current.nextDelay();
    if (delay !== null) {
      setConnectionState(prev => ({
        status: 'disconnected',
        retryCount: prev.retryCount + 1,
        lastAttempt: Date.now()
      }));

      toast({
        title: "Connection Lost",
        description: `Reconnecting... (Attempt ${backoff.current.attemptCount}/5)`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connection Failed",
        description: "Maximum retry attempts reached. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    connectionState,
    setConnectionState,
    handleConnectionError
  };
};