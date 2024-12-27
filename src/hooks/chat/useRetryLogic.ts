import { useState } from "react";
import { logger, LogCategory } from "@/utils/logging";
import { useToast } from "@/hooks/use-toast";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export const useRetryLogic = () => {
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const handleRetry = async (
    operation: () => Promise<void>,
    connectionStatus: string
  ) => {
    if (retryCount >= MAX_RETRIES) {
      logger.error(LogCategory.ERROR, 'RetryLogic', 'Max retries exceeded', {
        retryCount,
        connectionStatus,
        timestamp: new Date().toISOString(),
        lastAttempt: new Date().toISOString()
      });
      
      toast({
        title: "Failed to send message",
        description: connectionStatus === 'disconnected'
          ? "Connection lost. Please check your internet connection and try again."
          : "An error occurred. Please try again later.",
        variant: "destructive",
      });
      
      return;
    }

    const delay = RETRY_DELAY * Math.pow(2, retryCount);
    setRetryCount(prev => prev + 1);
    
    logger.info(LogCategory.STATE, 'RetryLogic', 'Scheduling retry:', {
      attempt: retryCount + 1,
      delay,
      connectionStatus,
      timestamp: new Date().toISOString(),
      nextAttemptIn: `${delay}ms`
    });

    await new Promise(resolve => setTimeout(resolve, delay));
    await operation();
  };

  const resetRetryCount = () => {
    logger.debug(LogCategory.STATE, 'RetryLogic', 'Resetting retry count', {
      previousCount: retryCount,
      timestamp: new Date().toISOString()
    });
    setRetryCount(0);
  };

  return {
    retryCount,
    handleRetry,
    resetRetryCount,
    hasReachedMaxRetries: retryCount >= MAX_RETRIES
  };
};