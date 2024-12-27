import { useCallback, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { RetryMetadata } from './types/errors';

interface RetryConfig {
  initialDelay: number;
  maxDelay: number;
  maxAttempts: number;
  jitter: boolean;
}

const DEFAULT_CONFIG: RetryConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: 5,
  jitter: true
};

export const useRetryManager = (config: RetryConfig = DEFAULT_CONFIG) => {
  const retryCount = useRef(0);
  const lastRetryTime = useRef<number>(Date.now());

  const calculateDelay = useCallback(() => {
    const delay = Math.min(
      config.initialDelay * Math.pow(2, retryCount.current),
      config.maxDelay
    );

    if (config.jitter) {
      return delay + (Math.random() * delay * 0.1); // Add up to 10% jitter
    }

    return delay;
  }, [config]);

  const shouldRetry = useCallback(() => {
    return retryCount.current < config.maxAttempts;
  }, [config.maxAttempts]);

  const getRetryMetadata = useCallback((): RetryMetadata => {
    const nextDelay = calculateDelay();
    return {
      attemptCount: retryCount.current,
      lastAttemptTime: lastRetryTime.current,
      nextDelayMs: nextDelay,
      maxAttemptsReached: retryCount.current >= config.maxAttempts
    };
  }, [calculateDelay, config.maxAttempts]);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> => {
    try {
      retryCount.current++;
      lastRetryTime.current = Date.now();
      
      logger.info(LogCategory.WEBSOCKET, 'RetryManager', 'Attempting retry', {
        attempt: retryCount.current,
        context,
        timestamp: new Date().toISOString()
      });

      const result = await operation();
      retryCount.current = 0; // Reset on success
      return result;
    } catch (error) {
      const metadata = getRetryMetadata();
      logger.error(LogCategory.WEBSOCKET, 'RetryManager', 'Retry failed', {
        error,
        metadata,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, [getRetryMetadata]);

  return {
    retry,
    shouldRetry,
    getRetryMetadata,
    reset: () => {
      retryCount.current = 0;
      lastRetryTime.current = Date.now();
    }
  };
};