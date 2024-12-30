import { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

interface QueuedMessage {
  message: Message;
  retryCount: number;
  lastAttempt: number;
}

class MessageQueueManager {
  private queue: QueuedMessage[] = [];
  private isProcessing: boolean = false;
  private maxRetries: number = 3;
  private retryDelay: number = 2000;

  enqueue(message: Message) {
    logger.debug(LogCategory.QUEUE, 'MessageQueueManager', 'Enqueueing message:', {
      messageId: message.id,
      queueLength: this.queue.length + 1
    });

    this.queue.push({
      message,
      retryCount: 0,
      lastAttempt: Date.now()
    });
  }

  dequeue(): QueuedMessage | undefined {
    const item = this.queue.shift();
    
    if (item) {
      logger.debug(LogCategory.QUEUE, 'MessageQueueManager', 'Dequeuing message:', {
        messageId: item.message.id,
        remainingQueue: this.queue.length
      });
    }
    
    return item;
  }

  peek(): QueuedMessage | undefined {
    return this.queue[0];
  }

  clear() {
    logger.info(LogCategory.QUEUE, 'MessageQueueManager', 'Clearing queue:', {
      clearedItems: this.queue.length
    });
    this.queue = [];
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  getQueueState() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      nextMessage: this.peek()?.message.id
    };
  }
}

export const messageQueueManager = new MessageQueueManager();