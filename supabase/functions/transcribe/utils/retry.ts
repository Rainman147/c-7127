export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 5000,
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS
): Promise<T> => {
  let lastError: Error;
  let attempt = 1;
  let delay = options.initialDelay;

  while (attempt <= options.maxAttempts) {
    try {
      console.log(`Attempt ${attempt}/${options.maxAttempts}`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (!isRetryableError(error) || attempt === options.maxAttempts) {
        throw error;
      }

      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
      
      delay = Math.min(delay * 2, options.maxDelay);
      attempt++;
    }
  }

  throw lastError;
};

const isRetryableError = (error: any): boolean => {
  return (
    error.status === 429 || // Rate limit
    error.status === 503 || // Service unavailable
    error.status === 504 || // Gateway timeout
    (error.status >= 500 && error.status < 600) || // Server errors
    error.retryable === true
  );
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));