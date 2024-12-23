import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/chat';
import type { DatabaseMessage } from '@/types/database/messages';

export const useMessageDatabase = () => {
  const insertUserMessage = async (
    chatId: string,
    content: string,
    type: 'text' | 'audio',
    sequence: number
  ) => {
    console.log('[useMessageDatabase] Inserting user message:', { 
      chatId, 
      contentLength: content.length,
      type,
      sequence 
    });

    const { data: userMessage, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        content,
        sender: 'user',
        type,
        sequence
      })
      .select()
      .single();

    if (error) {
      console.error('[useMessageDatabase] Database error on insert:', {
        error: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('[useMessageDatabase] Message inserted successfully:', {
      messageId: userMessage.id,
      sequence: userMessage.sequence
    });

    return userMessage as DatabaseMessage;
  };

  const fetchMessages = async (chatId: string) => {
    console.log('[useMessageDatabase] Fetching messages for chat:', chatId);

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('sequence', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[useMessageDatabase] Database error on fetch:', {
        error: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('[useMessageDatabase] Messages fetched successfully:', {
      count: messages.length,
      sequences: messages.map(m => m.sequence)
    });

    return messages as DatabaseMessage[];
  };

  return {
    insertUserMessage,
    fetchMessages
  };
};