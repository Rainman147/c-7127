import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';

export const useErrorHandler = (
  retryCount: number,
  activeSubscriptions: React.MutableRefObject<Set<string>>,
  MAX_RETRIES: number = 3
) => {
  const { toast } = useToast();

  return useCallback((error: Error, operation: string) => {
    logger.error(LogCategory.COMMUNICATION, 'RealTimeContext', `Error during ${operation}:`, {
      error,
      retryCount,
      timestamp: new Date().toISOString()
    });

    ErrorTracker.trackError(error, {
      component: 'RealTimeContext',
      severity: retryCount >= MAX_RETRIES ? 'high' : 'medium',
      timestamp: new Date().toISOString(),
      errorType: error.name,
      operation,
      additionalInfo: {
        activeSubscriptions: Array.from(activeSubscriptions.current)
      }
    });

    if (retryCount < MAX_RETRIES) {
      toast({
        title: "Connection Issue",
        description: `Attempting to reconnect... (${retryCount + 1}/${MAX_RETRIES})`,
        variant: "default",
      });
    } else {
      toast({
        title: "Connection Error",
        description: "Unable to establish connection. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [retryCount, toast, activeSubscriptions, MAX_RETRIES]);
};