import { QueuedMessage } from './QueueTypes';
import { logger, LogCategory } from '../logging/LoggerCore';

export class QueueProcessor {
  private retryDelays: number[] = [1000, 5000, 15000];
  private maxRetries: number = 3;

  prioritizeQueue(queue: QueuedMessage[]): QueuedMessage[] {
    const priorityMap = { high: 0, medium: 1, low: 2 };
    return [...queue].sort((a, b) => {
      const priorityDiff = priorityMap[a.priority] - priorityMap[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      const retryDiff = a.retryCount - b.retryCount;
      if (retryDiff !== 0) return retryDiff;
      
      return a.timestamp - b.timestamp;
    });
  }

  async processMessage(
    message: QueuedMessage,
    processor: (message: QueuedMessage) => Promise<void>
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await processor(message);
      logger.info(LogCategory.STATE, 'QueueProcessor', 'Message processed successfully', {
        messageId: message.id,
        retryCount: message.retryCount
      });
      return { success: true };
    } catch (error) {
      const delay = this.retryDelays[Math.min(message.retryCount, this.retryDelays.length - 1)];
      logger.error(LogCategory.ERROR, 'QueueProcessor', 'Failed to process message', {
        error,
        messageId: message.id,
        retryCount: message.retryCount,
        nextRetryDelay: delay
      });
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  shouldRetry(message: QueuedMessage): boolean {
    return message.retryCount < this.maxRetries;
  }

  getRetryDelay(retryCount: number): number {
    return this.retryDelays[Math.min(retryCount - 1, this.retryDelays.length - 1)];
  }
}