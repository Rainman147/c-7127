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
    const startTime = performance.now();
    console.log('[useMessageDatabase] Inserting user message:', { 
      chatId, 
      contentLength: content.length,
      type,
      sequence,
      timestamp: new Date().toISOString()
    });

    try {
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
          hint: error.hint,
          duration: `${(performance.now() - startTime).toFixed(2)}ms`
        });
        throw error;
      }

      const duration = performance.now() - startTime;
      console.log('[useMessageDatabase] Message inserted successfully:', {
        messageId: userMessage.id,
        sequence: userMessage.sequence,
        duration: `${duration.toFixed(2)}ms`
      });

      return userMessage as DatabaseMessage;
    } catch (error: any) {
      console.error('[useMessageDatabase] Unexpected error during insert:', {
        error: error.message,
        stack: error.stack,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      throw error;
    }
  };

  const fetchMessages = async (chatId: string) => {
    const startTime = performance.now();
    console.log('[useMessageDatabase] Fetching messages:', {
      chatId,
      timestamp: new Date().toISOString()
    });

    try {
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
          hint: error.hint,
          duration: `${(performance.now() - startTime).toFixed(2)}ms`
        });
        throw error;
      }

      const duration = performance.now() - startTime;
      console.log('[useMessageDatabase] Messages fetched successfully:', {
        count: messages.length,
        sequences: messages.map(m => m.sequence),
        duration: `${duration.toFixed(2)}ms`
      });

      return messages as DatabaseMessage[];
    } catch (error: any) {
      console.error('[useMessageDatabase] Unexpected error during fetch:', {
        error: error.message,
        stack: error.stack,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      throw error;
    }
  };

  return {
    insertUserMessage,
    fetchMessages
  };
};