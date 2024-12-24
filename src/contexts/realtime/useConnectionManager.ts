import { useState, useCallback, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { getNextRetryDelay, retryConfig } from './config';
import { useToast } from '@/hooks/use-toast';
import type { ConnectionState } from './config';

export const useConnectionManager = (
  retryTimeouts: React.MutableRefObject<Map<string, NodeJS.Timeout>>,
  subscribeToChat: (chatId: string) => void
) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastAttempt: 0,
    retryCount: 0,
  });
  
  const { toast } = useToast();
  const recoveryAttemptsRef = useRef<number>(0);
  const lastErrorRef = useRef<Error | null>(null);

  const handleConnectionError = useCallback((chatId: string, error: Error) => {
    logger.error(LogCategory.COMMUNICATION, 'RealTimeContext', 'Connection error:', {
      chatId,
      error,
      retryCount: connectionState.retryCount,
      recoveryAttempts: recoveryAttemptsRef.current,
      timestamp: new Date().toISOString()
    });

    // Don't retry if it's the same error occurring repeatedly
    if (lastErrorRef.current?.message === error.message) {
      recoveryAttemptsRef.current += 1;
    } else {
      recoveryAttemptsRef.current = 0;
      lastErrorRef.current = error;
    }

    if (connectionState.retryCount < retryConfig.maxAttempts && 
        recoveryAttemptsRef.current < retryConfig.maxAttempts) {
      const nextRetryDelay = getNextRetryDelay(connectionState.retryCount);
      
      setConnectionState(prev => ({
        status: 'connecting',
        lastAttempt: Date.now(),
        retryCount: prev.retryCount + 1,
        error,
      }));

      if (retryTimeouts.current.has(chatId)) {
        clearTimeout(retryTimeouts.current.get(chatId));
      }

      const timeout = setTimeout(() => {
        logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Attempting reconnection:', {
          chatId,
          attempt: connectionState.retryCount + 1,
          recoveryAttempts: recoveryAttemptsRef.current,
          timestamp: new Date().toISOString()
        });
        subscribeToChat(chatId);
      }, nextRetryDelay);

      retryTimeouts.current.set(chatId, timeout);
      
      toast({
        title: "Connection Error",
        description: `Retrying in ${Math.round(nextRetryDelay / 1000)}s... (Attempt ${connectionState.retryCount + 1}/${retryConfig.maxAttempts})`,
        variant: "destructive",
      });
      
      logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Scheduled retry:', {
        chatId,
        delay: nextRetryDelay,
        attempt: connectionState.retryCount + 1,
        timestamp: new Date().toISOString()
      });
    } else {
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected',
        error,
      }));
      
      toast({
        title: "Connection Failed",
        description: "Max retry attempts reached. Please refresh the page.",
        variant: "destructive",
      });
      
      logger.error(LogCategory.COMMUNICATION, 'RealTimeContext', 'Max retry attempts reached:', {
        chatId,
        maxAttempts: retryConfig.maxAttempts,
        recoveryAttempts: recoveryAttemptsRef.current,
        timestamp: new Date().toISOString()
      });
    }
  }, [connectionState.retryCount, retryTimeouts, subscribeToChat, toast]);

  return {
    connectionState,
    setConnectionState,
    handleConnectionError
  };
};