import { Message } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { messageLogger } from './messageLogger';

export class MessageQueueProcessor {
  private async processSingleMessage(queuedMessage: Message) {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          chat_id: queuedMessage.chat_id,
          content: queuedMessage.content,
          sender: queuedMessage.role,
          type: queuedMessage.type || 'text',
          sequence: queuedMessage.sequence,
          status: 'delivered',
          delivered_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const duration = performance.now() - startTime;
      messageLogger.logPerformanceMetric('message_processing', duration, {
        messageId: queuedMessage.id,
        success: true
      });

      return data;
    } catch (error) {
      const duration = performance.now() - startTime;
      messageLogger.logError('message_processing', error as Error, {
        messageId: queuedMessage.id,
        duration
      });
      throw error;
    }
  }

  public async processMessage(message: Message, retryCount = 0): Promise<Message | null> {
    try {
      const result = await this.processSingleMessage(message);
      return result;
    } catch (error) {
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return this.processMessage(message, retryCount + 1);
      }
      return null;
    }
  }
}

export const messageQueueProcessor = new MessageQueueProcessor();