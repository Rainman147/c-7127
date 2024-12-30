import { Message } from '@/types/chat';
import { messageLogger } from './messageLogger';
import { messageQueueProcessor } from './messageQueueProcessor';

type QueuedMessage = {
  message: Message;
  retryCount: number;
  lastAttempt?: Date;
};

class MessageQueueManager {
  private queue: QueuedMessage[] = [];
  private isProcessing: boolean = false;
  private maxRetries: number = 3;

  public enqueue(message: Message) {
    messageLogger.logQueueOperation('enqueue', this.queue.length + 1, { 
      messageId: message.id 
    });
    
    this.queue.push({
      message,
      retryCount: 0
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  public getQueueState() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      messages: this.queue.map(({ message, retryCount, lastAttempt }) => ({
        id: message.id,
        retryCount,
        lastAttempt
      }))
    };
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    messageLogger.logQueueOperation('process_start', this.queue.length);

    while (this.queue.length > 0) {
      const queuedItem = this.queue[0];
      const result = await messageQueueProcessor.processMessage(queuedItem.message);
      
      if (result) {
        this.queue.shift();
        messageLogger.logQueueOperation('message_processed', this.queue.length, {
          messageId: queuedItem.message.id
        });
      } else {
        if (queuedItem.retryCount >= this.maxRetries) {
          this.queue.shift();
          messageLogger.logQueueOperation('max_retries_reached', this.queue.length, {
            messageId: queuedItem.message.id,
            totalRetries: queuedItem.retryCount
          });
        } else {
          queuedItem.retryCount++;
          queuedItem.lastAttempt = new Date();
          this.queue.shift();
          this.queue.push(queuedItem);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    this.isProcessing = false;
    messageLogger.logQueueOperation('process_complete', this.queue.length);
  }
}

export const messageQueueManager = new MessageQueueManager();