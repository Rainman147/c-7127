import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useConnectionState } from '@/contexts/realtime/connectionState';
import { useToast } from '@/hooks/use-toast';
import type { ConnectionState } from '@/contexts/realtime/types';

export const useConnectionManager = () => {
  const { toast } = useToast();
  const { state, updateState, resetState } = useConnectionState();

  const handleConnectionSuccess = useCallback(() => {
    logger.info(LogCategory.COMMUNICATION, 'ConnectionManager', 'Connection successful', {
      previousState: state.status,
      timestamp: new Date().toISOString()
    });

    updateState({
      status: 'connected',
      retryCount: 0,
      error: undefined
    });

    if (state.retryCount > 0) {
      toast({
        description: "Connection restored",
        className: "bg-green-500 text-white",
      });
    }
  }, [state.status, state.retryCount, toast, updateState]);

  const handleConnectionError = useCallback((error: Error) => {
    logger.error(LogCategory.ERROR, 'ConnectionManager', 'Connection error', {
      error: error.message,
      retryCount: state.retryCount,
      timestamp: new Date().toISOString()
    });

    updateState({
      status: 'disconnected',
      retryCount: state.retryCount + 1,
      error
    });

    toast({
      title: "Connection Lost",
      description: `Reconnecting... (Attempt ${state.retryCount + 1}/5)`,
      variant: "destructive",
    });
  }, [state.retryCount, toast, updateState]);

  return {
    connectionState: state,
    handleConnectionSuccess,
    handleConnectionError,
    resetState
  };
};