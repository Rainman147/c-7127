import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const chatService = {
  async sendMessage(
    chatId: string,
    content: string,
    role: 'user' | 'assistant',
    type: 'text' | 'audio' = 'text'
  ): Promise<Message> {
    logger.debug(LogCategory.COMMUNICATION, 'chatService', 'Sending message:', {
      chatId,
      role,
      type,
      contentLength: content.length
    });

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        content,
        sender: role,
        type
      })
      .select()
      .single();

    if (error) {
      logger.error(LogCategory.ERROR, 'chatService', 'Error sending message:', error);
      throw error;
    }

    return {
      id: message.id,
      content: message.content,
      role: message.sender,
      type: message.type,
      sequence: message.sequence
    };
  },

  async getMessages(chatId: string): Promise<Message[]> {
    logger.debug(LogCategory.COMMUNICATION, 'chatService', 'Getting messages:', { chatId });

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(LogCategory.ERROR, 'chatService', 'Error getting messages:', error);
      throw error;
    }

    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.sender,
      type: msg.type,
      sequence: msg.sequence
    }));
  }
};