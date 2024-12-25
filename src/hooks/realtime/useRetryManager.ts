import { useRef, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import type { ErrorMetadata } from '@/types/errorTracking';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;
const MAX_DELAY = 30000;

export const useRetryManager = () => {
  const retryCountRef = useRef(0);
  const lastRetryTimeRef = useRef<number>(Date.now());

  const calculateDelay = useCallback(() => {
    const delay = Math.min(BASE_DELAY * Math.pow(2, retryCountRef.current), MAX_DELAY);
    logger.debug(LogCategory.COMMUNICATION, 'RetryManager', 'Calculating retry delay:', {
      attempt: retryCountRef.current,
      delay,
      timestamp: new Date().toISOString()
    });
    return delay;
  }, []);

  const handleRetry = useCallback(async (
    operation: () => Promise<void>,
    errorContext: string
  ) => {
    if (retryCountRef.current >= MAX_RETRIES) {
      const error = new Error(`Max retries (${MAX_RETRIES}) exceeded for ${errorContext}`);
      const metadata: ErrorMetadata = {
        component: 'RetryManager',
        severity: 'high',
        errorType: 'retry-exhausted',
        operation: errorContext,
        timestamp: new Date().toISOString(),
        additionalInfo: {
          retryCount: retryCountRef.current,
          lastRetryTime: lastRetryTimeRef.current
        }
      };
      ErrorTracker.trackError(error, metadata);
      throw error;
    }

    const delay = calculateDelay();
    retryCountRef.current += 1;
    lastRetryTimeRef.current = Date.now();

    logger.info(LogCategory.COMMUNICATION, 'RetryManager', 'Attempting retry:', {
      attempt: retryCountRef.current,
      delay,
      operation: errorContext,
      timestamp: new Date().toISOString()
    });

    await new Promise(resolve => setTimeout(resolve, delay));
    return operation();
  }, [calculateDelay]);

  const resetRetryCount = useCallback(() => {
    const previousCount = retryCountRef.current;
    retryCountRef.current = 0;
    logger.debug(LogCategory.STATE, 'RetryManager', 'Reset retry count:', {
      previousCount,
      timestamp: new Date().toISOString()
    });
  }, []);

  return {
    retryCount: retryCountRef.current,
    handleRetry,
    resetRetryCount
  };
};