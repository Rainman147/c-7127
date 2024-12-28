import { logger, LogCategory } from '@/utils/logging';
import { ExponentialBackoff } from '@/utils/backoff';
import type { ConnectionState } from '@/contexts/realtime/types';

export class ConnectionStateManager {
  private backoff: ExponentialBackoff;
  private lastStateChange: number;
  private readonly DEBOUNCE_INTERVAL = 1000; // 1 second

  constructor() {
    this.backoff = new ExponentialBackoff({
      initialDelay: 1000,
      maxDelay: 30000,
      maxAttempts: 5
    });
    this.lastStateChange = Date.now();
  }

  public shouldUpdateState(newState: ConnectionState, currentState: ConnectionState): boolean {
    const now = Date.now();
    const timeSinceLastChange = now - this.lastStateChange;

    // Prevent rapid state changes
    if (timeSinceLastChange < this.DEBOUNCE_INTERVAL) {
      logger.debug(LogCategory.WEBSOCKET, 'ConnectionStateManager', 'State change debounced', {
        currentState: currentState.status,
        attemptedState: newState.status,
        timeSinceLastChange,
        threshold: this.DEBOUNCE_INTERVAL
      });
      return false;
    }

    // Allow immediate transition to connected state
    if (newState.status === 'connected') {
      this.lastStateChange = now;
      return true;
    }

    // For disconnection, check if we should apply backoff
    if (newState.status === 'disconnected') {
      const delay = this.backoff.nextDelay();
      if (delay === null) {
        logger.error(LogCategory.WEBSOCKET, 'ConnectionStateManager', 'Max retry attempts reached', {
          attempts: this.backoff.attemptCount,
          timestamp: new Date().toISOString()
        });
        return false;
      }

      this.lastStateChange = now;
      return true;
    }

    this.lastStateChange = now;
    return true;
  }

  public getNextRetryDelay(): number | null {
    return this.backoff.nextDelay();
  }

  public reset(): void {
    this.backoff.reset();
    this.lastStateChange = Date.now();
  }

  public getCurrentRetryCount(): number {
    return this.backoff.attemptCount;
  }
}