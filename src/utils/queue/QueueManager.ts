import { logger, LogCategory } from '@/utils/logging';

export interface QueuedMessage {
  id: string;
  content: string;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'failed' | 'completed';
}

class QueueManager {
  private readonly storageKey = 'message_queue';
  private processingQueue: boolean = false;
  
  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const queue = localStorage.getItem(this.storageKey);
      if (!queue) {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
      }
    }
  }

  async addToQueue(message: Omit<QueuedMessage, 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newMessage: QueuedMessage = {
        ...message,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending'
      };

      queue.push(newMessage);
      await this.saveQueue(queue);

      logger.debug(LogCategory.STATE, 'QueueManager', 'Message added to queue', {
        messageId: message.id,
        priority: message.priority,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(LogCategory.ERROR, 'QueueManager', 'Failed to add message to queue', {
        error,
        messageId: message.id
      });
      throw error;
    }
  }

  private async getQueue(): Promise<QueuedMessage[]> {
    const queueStr = localStorage.getItem(this.storageKey);
    return queueStr ? JSON.parse(queueStr) : [];
  }

  private async saveQueue(queue: QueuedMessage[]): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(queue));
  }

  async processQueue(processor: (message: QueuedMessage) => Promise<void>): Promise<void> {
    if (this.processingQueue) {
      return;
    }

    this.processingQueue = true;
    try {
      const queue = await this.getQueue();
      const sortedQueue = this.prioritizeQueue(queue);

      for (const message of sortedQueue) {
        if (message.status === 'pending' || (message.status === 'failed' && message.retryCount < 3)) {
          try {
            message.status = 'processing';
            await this.saveQueue(sortedQueue);
            
            await processor(message);
            
            message.status = 'completed';
            logger.info(LogCategory.STATE, 'QueueManager', 'Message processed successfully', {
              messageId: message.id,
              retryCount: message.retryCount
            });
          } catch (error) {
            message.status = 'failed';
            message.retryCount++;
            logger.error(LogCategory.ERROR, 'QueueManager', 'Failed to process message', {
              error,
              messageId: message.id,
              retryCount: message.retryCount
            });
          }
          await this.saveQueue(sortedQueue);
        }
      }

      // Cleanup completed messages
      const cleanedQueue = sortedQueue.filter(
        msg => msg.status !== 'completed' && msg.retryCount < 3
      );
      await this.saveQueue(cleanedQueue);
    } finally {
      this.processingQueue = false;
    }
  }

  private prioritizeQueue(queue: QueuedMessage[]): QueuedMessage[] {
    const priorityMap = { high: 0, medium: 1, low: 2 };
    return [...queue].sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityMap[a.priority] - priorityMap[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by retry count (fewer retries first)
      const retryDiff = a.retryCount - b.retryCount;
      if (retryDiff !== 0) return retryDiff;
      
      // Finally by timestamp
      return a.timestamp - b.timestamp;
    });
  }

  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  }> {
    const queue = await this.getQueue();
    return queue.reduce((acc, msg) => {
      acc[msg.status]++;
      return acc;
    }, { pending: 0, processing: 0, failed: 0, completed: 0 });
  }
}

export const queueManager = new QueueManager();