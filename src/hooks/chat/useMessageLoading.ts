import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageLoading = () => {
  const loadMessages = useCallback(async (sessionId: string): Promise<Message[]> => {
    logger.info(LogCategory.STATE, 'useMessageLoading', 'Loading messages from database:', {
      sessionId
    });

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(LogCategory.ERROR, 'useMessageLoading', 'Error loading messages:', {
        sessionId,
        error
      });
      throw error;
    }

    const transformedMessages = messages.map((msg, index) => ({
      id: msg.id,
      role: msg.sender as 'user' | 'assistant',
      content: msg.content,
      type: msg.type as 'text' | 'audio',
      sequence: msg.sequence ?? index,
      created_at: msg.created_at,
      status: msg.status
    }));

    logger.debug(LogCategory.STATE, 'useMessageLoading', 'Messages loaded:', {
      sessionId,
      count: transformedMessages.length,
      messages: transformedMessages.map(m => ({
        id: m.id,
        sequence: m.sequence,
        role: m.role
      }))
    });

    return transformedMessages;
  }, []);

  return {
    loadMessages
  };
};