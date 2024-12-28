import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message, MessageType } from '@/types/chat';

export const useMessageQuery = (chatId: string | null) => {
  const fetchMessages = async (): Promise<Message[]> => {
    if (!chatId) {
      logger.debug(LogCategory.STATE, 'useMessageQuery', 'No chat ID provided');
      return [];
    }

    logger.debug(LogCategory.STATE, 'useMessageQuery', 'Fetching messages', {
      chatId,
      timestamp: new Date().toISOString()
    });
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(LogCategory.STATE, 'useMessageQuery', 'Error fetching messages:', {
        error: error.message,
        chatId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    logger.debug(LogCategory.STATE, 'useMessageQuery', 'Messages fetched successfully', {
      chatId,
      messageCount: data.length,
      timestamp: new Date().toISOString()
    });

    return data.map(msg => ({
      id: msg.id,
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
      type: msg.type as MessageType,
      sequence: msg.sequence,
      created_at: msg.created_at
    }));
  };

  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: fetchMessages,
    staleTime: 0, // Always fetch fresh data for real-time chat
    enabled: !!chatId,
    refetchOnWindowFocus: true,
    retry: 3,
    meta: {
      onError: (error: Error) => {
        logger.error(LogCategory.STATE, 'useMessageQuery', 'Query error:', {
          error: error instanceof Error ? error.message : String(error),
          chatId,
          timestamp: new Date().toISOString()
        });
      }
    }
  });
};