import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';

export const useChat = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: Error, operation: string) => {
    logger.error(LogCategory.COMMUNICATION, 'useChat', `Error during ${operation}:`, {
      error,
      timestamp: new Date().toISOString()
    });

    ErrorTracker.trackError(error, {
      component: 'useChat',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      errorType: error.name,
      operation,
      additionalInfo: {
        timestamp: new Date().toISOString()
      }
    });

    toast({
      title: "Chat Error",
      description: "An error occurred. Please try again.",
      variant: "destructive",
    });
  }, [toast]);

  return {
    handleError
  };
};