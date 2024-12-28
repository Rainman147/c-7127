import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionConfig } from '@/contexts/realtime/types';

interface QueuedSubscription {
  config: SubscriptionConfig;
  timestamp: number;
  retryCount: number;
}

export class QueueManager {
  private subscriptionQueue: QueuedSubscription[] = [];
  private isProcessingQueue = false;

  public queueSubscription(config: SubscriptionConfig): void {
    logger.debug(LogCategory.WEBSOCKET, 'QueueManager', 'Queueing subscription', {
      table: config.table,
      filter: config.filter,
      timestamp: new Date().toISOString()
    });

    this.subscriptionQueue.push({
      config,
      timestamp: Date.now(),
      retryCount: 0
    });
  }

  public async processQueue(isReady: boolean, processSubscription: (subscription: QueuedSubscription) => Promise<void>): Promise<void> {
    if (this.isProcessingQueue || !isReady) {
      return;
    }

    this.isProcessingQueue = true;
    logger.info(LogCategory.WEBSOCKET, 'QueueManager', 'Processing subscription queue', {
      queueLength: this.subscriptionQueue.length,
      timestamp: new Date().toISOString()
    });

    while (this.subscriptionQueue.length > 0 && isReady) {
      const subscription = this.subscriptionQueue.shift();
      if (!subscription) continue;

      try {
        await processSubscription(subscription);
      } catch (error) {
        logger.error(LogCategory.WEBSOCKET, 'QueueManager', 'Failed to process subscription', {
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

  public clearQueue(): void {
    this.subscriptionQueue = [];
    this.isProcessingQueue = false;
  }

  public getQueueSize(): number {
    return this.subscriptionQueue.length;
  }
}