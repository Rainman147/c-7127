import { logger, LogCategory } from '@/utils/logging';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorMetadata {
  component: string;
  timestamp: string;
  errorType: string;
  severity: ErrorSeverity;
  retryCount?: number;
  connectionState?: string;
  additionalInfo?: Record<string, any>;
}

class ErrorTracker {
  private static errorCounts: Map<string, number> = new Map();
  private static lastErrorTime: Map<string, number> = new Map();
  private static readonly ERROR_THRESHOLD = 5;
  private static readonly ERROR_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  static trackError(error: Error, metadata: ErrorMetadata): void {
    const errorKey = `${metadata.component}:${error.name}`;
    const currentTime = Date.now();
    const lastTime = this.lastErrorTime.get(errorKey) || 0;
    const count = (this.errorCounts.get(errorKey) || 0) + 1;

    // Reset error count if cooldown period has passed
    if (currentTime - lastTime > this.ERROR_COOLDOWN) {
      this.errorCounts.set(errorKey, 1);
    } else {
      this.errorCounts.set(errorKey, count);
    }

    this.lastErrorTime.set(errorKey, currentTime);

    logger.error(LogCategory.ERROR, metadata.component, error.message, {
      ...metadata,
      errorCount: count,
      stackTrace: error.stack,
      timeSinceLastError: currentTime - lastTime
    });

    // Check if we should trigger circuit breaker
    if (count >= this.ERROR_THRESHOLD) {
      logger.error(LogCategory.ERROR, metadata.component, 'Circuit breaker triggered', {
        errorKey,
        errorCount: count,
        cooldownPeriod: this.ERROR_COOLDOWN
      });
    }
  }

  static shouldRetry(component: string, errorType: string): boolean {
    const errorKey = `${component}:${errorType}`;
    const count = this.errorCounts.get(errorKey) || 0;
    const lastTime = this.lastErrorTime.get(errorKey) || 0;
    const currentTime = Date.now();

    // Allow retry if cooldown period has passed or error count is below threshold
    return (currentTime - lastTime > this.ERROR_COOLDOWN) || (count < this.ERROR_THRESHOLD);
  }

  static getBackoffDelay(retryCount: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    return delay + (Math.random() * 1000); // Add jitter
  }
}

export { ErrorTracker };