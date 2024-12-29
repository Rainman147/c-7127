import { useCallback, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import type { ConnectionState, WebSocketError } from '@/types/realtime';
import { useRetryLogic } from '@/hooks/chat/useRetryLogic';

export const useConnectionManager = () => {
  const { toast } = useToast();
  const retryManager = useRetryLogic();
  const connectionStateRef = useRef<ConnectionState>({
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now(),
    error: undefined
  });

  const handleConnectionError = useCallback((error: WebSocketError) => {
    logger.error(LogCategory.WEBSOCKET, 'RealTimeProvider', 'WebSocket error occurred', {
      error,
      timestamp: new Date().toISOString()
    });

    connectionStateRef.current = {
      status: 'disconnected',
      error,
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