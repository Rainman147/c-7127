import { Message, MessageStatus } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';

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
    // Start processing the queue
    this.processQueue();
  }

  public enqueue(message: Message) {
    logger.info(LogCategory.STATE, 'MessageQueue', 'Enqueueing message:', { 
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
    logger.debug(LogCategory.STATE, 'MessageQueue', 'Processing queue:', { 
      queueLength: this.queue.length 
    });

    while (this.queue.length > 0) {
      const queuedMessage = this.queue[0];
      const { message, retryCount } = queuedMessage;

      try {
        // Attempt to send the message
        const { data, error } = await supabase
          .from('messages')
          .insert([{
            chat_id: message.id.split('-')[0], // Assuming chat_id is first part of message id
            content: message.content,
            sender: message.role,
            type: message.type || 'text',
            sequence: message.sequence,
            delivered_at: null,
            seen_at: null
          }])
          .select()
          .single();

        if (error) throw error;

        // Message sent successfully
        this.queue.shift(); // Remove from queue

        logger.info(LogCategory.STATE, 'MessageQueue', 'Message sent successfully:', { 
          messageId: message.id 
        });

      } catch (error) {
        logger.error(LogCategory.ERROR, 'MessageQueue', 'Error sending message:', {
          messageId: message.id,
          error,
          retryCount
        });

        if (retryCount >= this.maxRetries) {
          // Max retries reached, remove from queue
          this.queue.shift();
        } else {
          // Update retry count and move to end of queue
          queuedMessage.retryCount++;
          queuedMessage.lastAttempt = new Date();
          this.queue.shift();
          this.queue.push(queuedMessage);
          
          // Wait before next retry
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    this.isProcessing = false;
  }
}

// Export singleton instance
export const messageQueue = new MessageQueue();