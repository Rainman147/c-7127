import { logger, LogCategory } from '@/utils/logging';

export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeout: number = 60000,
    private readonly halfOpenTimeout: number = 30000
  ) {}

  public recordFailure(): boolean {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      logger.warn(LogCategory.WEBSOCKET, 'CircuitBreaker', 'Circuit opened', {
        failures: this.failures,
        lastFailure: new Date(this.lastFailureTime).toISOString()
      });
      return false;
    }
    return true;
  }

  public canAttempt(): boolean {
    const now = Date.now();
    
    if (this.state === 'open') {
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'half-open';
        logger.info(LogCategory.WEBSOCKET, 'CircuitBreaker', 'Circuit half-open');
        return true;
      }
      return false;
    }
    
    if (this.state === 'half-open') {
      return now - this.lastFailureTime >= this.halfOpenTimeout;
    }
    
    return true;
  }

  public recordSuccess(): void {
    if (this.state === 'half-open') {
      this.reset();
      logger.info(LogCategory.WEBSOCKET, 'CircuitBreaker', 'Circuit closed after success');
    }
  }

  public reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }

  public getState(): string {
    return this.state;
  }
}