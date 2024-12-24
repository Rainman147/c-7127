import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

export const useRealtimeMessages = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: Error, operation: string) => {
    logger.error(LogCategory.COMMUNICATION, 'useRealtimeMessages', `Error during ${operation}:`, {
      error,
      timestamp: new Date().toISOString()
    });

    ErrorTracker.trackError(error, {
      component: 'useRealtimeMessages',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      errorType: error.name,
      operation,
      additionalInfo: {
        timestamp: new Date().toISOString()
      }
    });

    toast({
      title: "Error",
      description: "Failed to process messages. Please try again.",
      variant: "destructive",
    });
  }, [toast]);

  return {
    handleError
  };
};