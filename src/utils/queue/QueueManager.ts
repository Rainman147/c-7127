import { logger, LogCategory } from '@/utils/logging';

export interface QueuedMessage {
  id: string;
  content: string;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'failed' | 'completed';
  metadata?: {
    connectionState?: string;
    lastError?: string;
    processingAttempts?: number[];
  };
}

class QueueManager {
  private readonly storageKey = 'message_queue';
  private processingQueue: boolean = false;
  private maxRetries: number = 3;
  private retryDelays: number[] = [1000, 5000, 15000]; // Progressive delays
  
  constructor() {
    this.initializeStorage();
    this.setupOfflineListener();
  }

  private initializeStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const queue = localStorage.getItem(this.storageKey);
      if (!queue) {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
      }
    }
  }

  private setupOfflineListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  private handleOnline(): void {
    logger.info(LogCategory.STATE, 'QueueManager', 'Connection restored, processing queue');
    this.processQueue((message) => {
      // Default processor - should be overridden by actual implementation
      console.log('Processing message:', message);
      return Promise.resolve();
    });
  }

  private handleOffline(): void {
    logger.warn(LogCategory.STATE, 'QueueManager', 'Connection lost, pausing queue processing');
    this.processingQueue = false;
  }

  async addToQueue(message: Omit<QueuedMessage, 'timestamp' | 'retryCount' | 'status' | 'metadata'>): Promise<void> {
    try {
      const queue = await this.getQueue();
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
    if (this.processingQueue || !navigator.onLine) {
      logger.debug(LogCategory.STATE, 'QueueManager', 'Queue processing skipped', {
        reason: this.processingQueue ? 'Already processing' : 'Offline'
      });
      return;
    }

    this.processingQueue = true;
    try {
      const queue = await this.getQueue();
      const sortedQueue = this.prioritizeQueue(queue);

      for (const message of sortedQueue) {
        if (message.status === 'pending' || 
            (message.status === 'failed' && message.retryCount < this.maxRetries)) {
          try {
            message.status = 'processing';
            message.metadata = {
              ...message.metadata,
              processingAttempts: [...(message.metadata?.processingAttempts || []), Date.now()]
            };
            await this.saveQueue(sortedQueue);
            
            await processor(message);
            
            message.status = 'completed';
            logger.info(LogCategory.STATE, 'QueueManager', 'Message processed successfully', {
              messageId: message.id,
              retryCount: message.retryCount,
              attempts: message.metadata?.processingAttempts?.length
            });
          } catch (error) {
            message.status = 'failed';
            message.retryCount++;
            message.metadata = {
              ...message.metadata,
              lastError: error.message
            };
            
            const delay = this.retryDelays[Math.min(message.retryCount - 1, this.retryDelays.length - 1)];
            logger.error(LogCategory.ERROR, 'QueueManager', 'Failed to process message', {
              error,
              messageId: message.id,
              retryCount: message.retryCount,
              nextRetryDelay: delay
            });
            
            if (message.retryCount < this.maxRetries) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          await this.saveQueue(sortedQueue);
        }
      }

      // Cleanup completed and failed messages
      const cleanedQueue = sortedQueue.filter(
        msg => msg.status !== 'completed' && 
              !(msg.status === 'failed' && msg.retryCount >= this.maxRetries)
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
    totalMessages: number;
    oldestMessage: number | null;
    averageProcessingTime: number | null;
  }> {
    const queue = await this.getQueue();
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
    await this.saveQueue([]);
    logger.info(LogCategory.STATE, 'QueueManager', 'Queue cleared');
  }
}

export const queueManager = new QueueManager();