import { supabase } from '@/integrations/supabase/client';
import { Message, MessageStatus } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

export const sendMessage = async (
  content: string, 
  chatId: string, 
  type: 'text' | 'audio' = 'text',
  sequence: number
): Promise<Message> => {
  logger.info(LogCategory.COMMUNICATION, 'messageOperations', 'Sending message:', {
    chatId,
    type,
    contentLength: content.length,
    sequence
  });

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      content,
      type,
      sender: 'user',
      sequence,
      status: 'delivered'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...message,
    role: message.sender as 'user' | 'assistant',
    status: message.status as MessageStatus,
    type: message.type as 'text' | 'audio'
  };
};

export const editMessage = async (messageId: string, content: string, userId: string): Promise<any> => {
  logger.info(LogCategory.STATE, 'messageOperations', 'Editing message:', {
    messageId,
    contentLength: content.length
  });

  const { data: editedMessage, error } = await supabase
    .from('edited_messages')
    .upsert({
      message_id: messageId,
      edited_content: content,
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;
  return editedMessage;
};