import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageDatabase = () => {
  const saveMessage = async ({
    content,
    type = 'text',
    chatId,
    role,
    sequence
  }: {
    content: string;
    type?: 'text' | 'audio';
    chatId: string;
    role: 'user' | 'assistant';
    sequence: number;
  }): Promise<Message> => {
    logger.debug(LogCategory.DATABASE, 'useMessageDatabase', 'Saving message:', {
      contentLength: content.length,
      type,
      chatId,
      role,
      sequence
    });

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        content,
        type,
        chat_id: chatId,
        sender: role,
        sequence
      })
      .select()
      .single();

    if (error) {
      logger.error(LogCategory.ERROR, 'useMessageDatabase', 'Error saving message:', error);
      throw error;
    }

    logger.info(LogCategory.DATABASE, 'useMessageDatabase', 'Message saved successfully:', {
      messageId: message.id
    });

    return {
      id: message.id,
      content: message.content,
      role: message.sender as 'user' | 'assistant',
      type: message.type as 'text' | 'audio',
      sequence: message.sequence,
      chat_id: message.chat_id
    };
  };

  return {
    saveMessage
  };
};