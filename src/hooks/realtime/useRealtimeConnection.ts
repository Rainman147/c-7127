import { useCallback, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import type { CustomError, ConnectionError } from '@/contexts/realtime/types/errors';
import type { ConnectionState } from '@/contexts/realtime/types';
import { useRetryManager } from './useRetryManager';

export const useRealtimeConnection = () => {
  const { toast } = useToast();
  const retryManager = useRetryManager();
  const connectionStateRef = useRef<ConnectionState>({
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now(),
    error: undefined
  });

  const handleConnectionError = useCallback((error: CustomError) => {
    logger.error(LogCategory.WEBSOCKET, 'RealTimeProvider', 'WebSocket error occurred', {
      error,
      timestamp: new Date().toISOString()
    });

    const connectionError: ConnectionError = {
      name: 'ConnectionError',
      code: error.code || 0,
      reason: error.reason || 'Unknown error',
      timestamp: new Date().toISOString(),
      connectionState: 'error',
      retryCount: retryManager.getAttemptCount(),
      lastAttempt: Date.now(),
      backoffDelay: retryManager.getNextDelay() || 0,
      message: error.message
    };

    connectionStateRef.current = {
      status: 'disconnected',
      error: connectionError,
      retryCount: connectionStateRef.current.retryCount + 1,
      lastAttempt: Date.now()
    };

    toast({
      title: "Connection Lost",
      description: `Attempting to reconnect... (Attempt ${retryManager.getAttemptCount()}/5)`,
      variant: "destructive",
    });
  }, [retryManager, toast]);

  return {
    connectionState: connectionStateRef.current,
    handleConnectionError,
    retryManager
  };
};