import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message, MessageRole, MessageType } from '@/types/chat';

export const chatService = {
  async sendMessage(
    chatId: string,
    content: string,
    role: MessageRole,
    type: MessageType = 'text'
  ): Promise<Message> {
    logger.debug(LogCategory.COMMUNICATION, 'chatService', 'Sending message:', {
      chatId,
      role,
      type,
      contentLength: content.length
    });

    const { data, error } = await supabase
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
      id: data.id,
      content: data.content,
      role: data.sender as MessageRole,
      type: data.type as MessageType,
      sequence: data.sequence,
      created_at: data.created_at
    };
  },

  async getMessages(chatId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(LogCategory.ERROR, 'chatService', 'Error fetching messages:', error);
      throw error;
    }

    return data.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.sender as MessageRole,
      type: msg.type as MessageType,
      sequence: msg.sequence,
      created_at: msg.created_at
    }));
  }
};