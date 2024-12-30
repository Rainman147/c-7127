import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message, MessageStatus } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

export const useMessageOperations = () => {
  const { toast } = useToast();

  const handleMessageSend = useCallback(async (
    content: string,
    chatId: string,
    type: 'text' | 'audio' = 'text',
    sequence: number
  ) => {
    logger.info(LogCategory.STATE, 'MessageOperations', 'Sending message:', {
      chatId,
      type,
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
  }, []);

  const handleMessageEdit = useCallback(async (messageId: string, content: string) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('edited_messages')
      .upsert({
        message_id: messageId,
        edited_content: content,
        user_id: userId
      });

    if (error) throw error;
  }, []);

  return {
    handleMessageSend,
    handleMessageEdit
  };
};