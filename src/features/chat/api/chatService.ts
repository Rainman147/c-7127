import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const chatService = {
  async sendMessage(chatId: string, content: string, role: 'user' | 'assistant', type: 'text' | 'audio' = 'text') {
    logger.debug(LogCategory.COMMUNICATION, 'ChatService', 'Sending message:', {
      chatId,
      contentLength: content.length,
      role,
      type
    });

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content,
          sender: role,
          type,
          sequence: Date.now() // Temporary sequence until we implement proper ordering
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(LogCategory.COMMUNICATION, 'ChatService', 'Message sent successfully:', {
        messageId: message.id
      });

      return message;
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatService', 'Error sending message:', error);
      throw error;
    }
  },

  async getMessages(chatId: string): Promise<Message[]> {
    logger.debug(LogCategory.COMMUNICATION, 'ChatService', 'Fetching messages:', { chatId });

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('sequence', { ascending: true });

      if (error) throw error;

      logger.info(LogCategory.COMMUNICATION, 'ChatService', 'Messages fetched successfully:', {
        count: messages.length
      });

      return messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.sender as 'user' | 'assistant',
        type: msg.type as 'text' | 'audio',
        sequence: msg.sequence
      }));
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatService', 'Error fetching messages:', error);
      throw error;
    }
  },

  async processAIResponse(message: string, chatId: string) {
    logger.debug(LogCategory.COMMUNICATION, 'ChatService', 'Processing AI response:', {
      chatId,
      messageLength: message.length
    });

    try {
      const response = await supabase.functions.invoke('chat', {
        body: { message, chatId }
      });

      if (response.error) throw response.error;

      const aiMessage = await this.sendMessage(chatId, response.data.content, 'assistant');
      
      logger.info(LogCategory.COMMUNICATION, 'ChatService', 'AI response processed and saved:', {
        messageId: aiMessage.id
      });

      return aiMessage;
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatService', 'Error processing AI response:', error);
      throw error;
    }
  }
};