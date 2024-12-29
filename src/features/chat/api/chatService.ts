import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const chatService = {
  async sendMessage(chatId: string, content: string, role: 'user' | 'assistant', type: 'text' | 'audio' = 'text'): Promise<Message> {
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
          sequence: Date.now()
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(LogCategory.COMMUNICATION, 'ChatService', 'Message sent successfully:', {
        messageId: message.id
      });

      return {
        id: message.id,
        content: message.content,
        role: message.sender as 'user' | 'assistant',
        type: message.type as 'text' | 'audio',
        sequence: message.sequence,
        created_at: message.created_at
      };
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
        sequence: msg.sequence,
        created_at: msg.created_at
      }));
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatService', 'Error fetching messages:', error);
      throw error;
    }
  }
};