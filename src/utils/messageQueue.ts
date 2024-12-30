import { Message, MessageStatus } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { messageLogger } from './messageLogger';

type QueuedMessage = {
  message: Message;
  retryCount: number;
  lastAttempt?: Date;
};

class MessageQueue {
  private queue: QueuedMessage[] = [];
  private isProcessing: boolean = false;
  private maxRetries: number = 3;
  private retryDelay: number = 2000; // 2 seconds

  constructor() {
    this.processQueue();
  }

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

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    messageLogger.logQueueOperation('process_start', this.queue.length);

    while (this.queue.length > 0) {
      const queuedMessage = this.queue[0];
      const { message, retryCount } = queuedMessage;
      const startTime = performance.now();

      try {
        const { data, error } = await supabase
          .from('messages')
          .insert([{
            chat_id: message.chat_id,
            content: message.content,
            sender: message.role,
            type: message.type || 'text',
            sequence: message.sequence,
            status: 'delivered',
            delivered_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;

        this.queue.shift();
        
        const duration = performance.now() - startTime;
        messageLogger.logPerformanceMetric('message_processing', duration, {
          messageId: message.id,
          success: true
        });

      } catch (error) {
        const duration = performance.now() - startTime;
        messageLogger.logError('queue_processing', error as Error, {
          messageId: message.id,
          retryCount,
          duration
        });

        if (retryCount >= this.maxRetries) {
          this.queue.shift();
          messageLogger.logQueueOperation('max_retries_reached', this.queue.length, {
            messageId: message.id,
            totalRetries: retryCount
          });
        } else {
          queuedMessage.retryCount++;
          queuedMessage.lastAttempt = new Date();
          this.queue.shift();
          this.queue.push(queuedMessage);
          
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    this.isProcessing = false;
    messageLogger.logQueueOperation('process_complete', this.queue.length);
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
}

export const messageQueue = new MessageQueue();