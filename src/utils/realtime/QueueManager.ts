import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionConfig } from '@/features/realtime/types';

export class QueueManager {
  private queue: SubscriptionConfig[] = [];

  public queueSubscription(config: SubscriptionConfig): void {
    this.queue.push(config);
    logger.debug(LogCategory.STATE, 'QueueManager', 'Subscription queued', {
      table: config.table,
      timestamp: new Date().toISOString()
    });
  }

  public async processQueue(
    isReady: boolean,
    processor: (subscription: SubscriptionConfig) => Promise<void>
  ): Promise<void> {
    if (!isReady || this.queue.length === 0) return;

    logger.debug(LogCategory.STATE, 'QueueManager', 'Processing queue', {
      queueLength: this.queue.length,
      timestamp: new Date().toISOString()
    });

    while (this.queue.length > 0) {
      const subscription = this.queue.shift();
      if (subscription) {
        await processor(subscription);
      }
    }
  }

  public clearQueue(): void {
    this.queue = [];
    logger.debug(LogCategory.STATE, 'QueueManager', 'Queue cleared', {
      timestamp: new Date().toISOString()
    });
  }
}