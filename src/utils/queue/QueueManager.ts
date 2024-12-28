import { QueuedMessage, QueueStatus } from './QueueTypes';
import { QueueStorage } from './QueueStorage';
import { QueueProcessor } from './QueueProcessor';
import { logger, LogCategory } from '../logging/LoggerCore';

export class QueueManager {
  private processingQueue: boolean = false;
  private queueStorage: QueueStorage;
  private queueProcessor: QueueProcessor;

  constructor() {
    this.queueStorage = new QueueStorage();
    this.queueProcessor = new QueueProcessor();
    this.setupOfflineListener();
  }

  private setupOfflineListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  private handleOnline(): void {
    logger.info(LogCategory.STATE, 'QueueManager', 'Connection restored, processing queue');
    this.processingQueue = false;
  }

  private handleOffline(): void {
    logger.warn(LogCategory.STATE, 'QueueManager', 'Connection lost, pausing queue processing');
    this.processingQueue = false;
  }

  async addToQueue(message: Omit<QueuedMessage, 'timestamp' | 'retryCount' | 'status' | 'metadata'>): Promise<void> {
    try {
      const queue = await this.queueStorage.getQueue();
      const newMessage: QueuedMessage = {
        ...message,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
        metadata: {
          connectionState: navigator.onLine ? 'online' : 'offline',
          processingAttempts: []
        }
      };

      queue.push(newMessage);
      await this.queueStorage.saveQueue(queue);

      logger.debug(LogCategory.STATE, 'QueueManager', 'Message added to queue', {
        messageId: message.id,
        priority: message.priority
      });
    } catch (error) {
      logger.error(LogCategory.ERROR, 'QueueManager', 'Failed to add message to queue', {
        error,
        messageId: message.id
      });
      throw error;
    }
  }

  async processQueue(processor: (message: QueuedMessage) => Promise<void>): Promise<void> {
    if (this.processingQueue || !navigator.onLine) {
      return;
    }

    this.processingQueue = true;
    try {
      const queue = await this.queueStorage.getQueue();
      const sortedQueue = this.queueProcessor.prioritizeQueue(queue);

      for (const message of sortedQueue) {
        if (message.status === 'pending' || 
            (message.status === 'failed' && this.queueProcessor.shouldRetry(message))) {
          message.status = 'processing';
          await this.queueStorage.saveQueue(sortedQueue);

          const result = await this.queueProcessor.processMessage(message, processor);
          
          if (result.success) {
            message.status = 'completed';
          } else {
            message.status = 'failed';
            message.retryCount++;
            message.metadata = {
              ...message.metadata,
              lastError: result.error?.message
            };
            
            if (this.queueProcessor.shouldRetry(message)) {
              await new Promise(resolve => setTimeout(resolve, 
                this.queueProcessor.getRetryDelay(message.retryCount)));
            }
          }
          await this.queueStorage.saveQueue(sortedQueue);
        }
      }

      // Cleanup completed and failed messages
      const cleanedQueue = sortedQueue.filter(
        msg => msg.status !== 'completed' && 
              !(msg.status === 'failed' && !this.queueProcessor.shouldRetry(msg))
      );
      await this.queueStorage.saveQueue(cleanedQueue);
    } finally {
      this.processingQueue = false;
    }
  }

  async getQueueStatus(): Promise<QueueStatus> {
    const queue = await this.queueStorage.getQueue();
    const status = queue.reduce((acc, msg) => {
      acc[msg.status]++;
      return acc;
    }, { pending: 0, processing: 0, failed: 0, completed: 0 });

    const oldestMessage = queue.length > 0 
      ? Math.min(...queue.map(msg => msg.timestamp))
      : null;

    const completedMessages = queue.filter(msg => msg.status === 'completed');
    const averageProcessingTime = completedMessages.length > 0
      ? completedMessages.reduce((sum, msg) => {
          const attempts = msg.metadata?.processingAttempts || [];
          return sum + (attempts[attempts.length - 1] - attempts[0]);
        }, 0) / completedMessages.length
      : null;

    return {
      ...status,
      totalMessages: queue.length,
      oldestMessage,
      averageProcessingTime
    };
  }

  async clearQueue(): Promise<void> {
    await this.queueStorage.saveQueue([]);
    logger.info(LogCategory.STATE, 'QueueManager', 'Queue cleared');
  }
}

export const queueManager = new QueueManager();