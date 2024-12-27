import { logger, LogCategory } from '@/utils/logging';
import { ExponentialBackoff } from '@/utils/backoff';
import type { SubscriptionConfig } from './types';
import type { ConnectionState } from './types';

interface QueuedSubscription {
  config: SubscriptionConfig;
  timestamp: number;
  retryCount: number;
}

export class ConnectionManager {
  private connectionState: ConnectionState = {
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now(),
    error: undefined
  };
  private subscriptionQueue: QueuedSubscription[] = [];
  private backoff: ExponentialBackoff;
  private isProcessingQueue = false;

  constructor() {
    this.backoff = new ExponentialBackoff({
      initialDelay: 1000,
      maxDelay: 30000,
      maxAttempts: 5
    });
  }

  public isReady(): boolean {
    return this.connectionState.status === 'connected';
  }

  public queueSubscription(config: SubscriptionConfig): void {
    logger.debug(LogCategory.WEBSOCKET, 'ConnectionManager', 'Queueing subscription', {
      table: config.table,
      filter: config.filter,
      timestamp: new Date().toISOString()
    });

    this.subscriptionQueue.push({
      config,
      timestamp: Date.now(),
      retryCount: 0
    });

    if (this.isReady() && !this.isProcessingQueue) {
      this.processQueue();
    }
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.isReady()) {
      return;
    }

    this.isProcessingQueue = true;
    logger.info(LogCategory.WEBSOCKET, 'ConnectionManager', 'Processing subscription queue', {
      queueLength: this.subscriptionQueue.length,
      timestamp: new Date().toISOString()
    });

    while (this.subscriptionQueue.length > 0 && this.isReady()) {
      const subscription = this.subscriptionQueue.shift();
      if (!subscription) continue;

      try {
        await this.processSubscription(subscription);
      } catch (error) {
        logger.error(LogCategory.WEBSOCKET, 'ConnectionManager', 'Failed to process subscription', {
          error: error instanceof Error ? error.message : String(error),
          table: subscription.config.table,
          retryCount: subscription.retryCount,
          timestamp: new Date().toISOString()
        });

        if (subscription.retryCount < 3) {
          this.subscriptionQueue.push({
            ...subscription,
            retryCount: subscription.retryCount + 1
          });
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async processSubscription(subscription: QueuedSubscription): Promise<void> {
    const delay = this.backoff.nextDelay(); // Changed from getDelay to nextDelay
    if (delay !== null) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // This will be handled by the RealTimeProvider
    subscription.config.onSubscriptionStatus?.('SUBSCRIBING');
  }

  public updateConnectionState(newState: Partial<ConnectionState>): void {
    this.connectionState = {
      ...this.connectionState,
      ...newState,
      lastAttempt: Date.now()
    };

    logger.info(LogCategory.WEBSOCKET, 'ConnectionManager', 'Connection state updated', {
      previousStatus: this.connectionState.status,
      newStatus: newState.status,
      retryCount: this.connectionState.retryCount,
      timestamp: new Date().toISOString()
    });

    if (this.isReady()) {
      this.processQueue();
    }
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  public clearQueue(): void {
    this.subscriptionQueue = [];
    this.isProcessingQueue = false;
  }
}