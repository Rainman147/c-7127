import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useMessageOperations } from './query/useMessageOperations';
import { useMessageCache } from './query/useMessageCache';
import type { DatabaseMessage } from '@/types/database/messages';
import type { Message } from '@/types/chat';

const mapDatabaseMessageToMessage = (dbMessage: DatabaseMessage): Message => ({
  id: dbMessage.id,
  content: dbMessage.content,
  role: dbMessage.sender as 'user' | 'assistant',
  type: dbMessage.type as 'text' | 'audio',
  sequence: dbMessage.sequence || undefined,
  created_at: dbMessage.created_at
});

export const useMessageQuery = (chatId: string | null) => {
  const { addMessage, updateMessage } = useMessageOperations(chatId);
  const { invalidateMessages } = useMessageCache(chatId);

  const fetchMessages = async (id: string): Promise<Message[]> => {
    logger.debug(LogCategory.COMMUNICATION, 'useMessageQuery', 'Fetching messages:', { 
      chatId: id 
    });
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(LogCategory.ERROR, 'useMessageQuery', 'Error fetching messages:', { 
        error,
        chatId: id
      });
      throw error;
    }

    logger.debug(LogCategory.STATE, 'useMessageQuery', 'Messages fetched successfully:', {
      chatId: id,
      messageCount: data?.length || 0
    });

    return (data as DatabaseMessage[]).map(mapDatabaseMessageToMessage);
  };

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => chatId ? fetchMessages(chatId) : Promise.resolve([]),
    enabled: !!chatId,
    staleTime: 1000 * 30, // Reduced from 60s to 30s for more frequent updates
    gcTime: 1000 * 60 * 5, // Cache garbage collection after 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
    meta: {
      errorHandler: (error: Error) => {
        logger.error(LogCategory.ERROR, 'useMessageQuery', 'Query error:', {
          error,
          chatId
        });
      }
    }
  });

  return {
    messages: messages || [],
    isLoading,
    error,
    addMessage,
    updateMessage,
    invalidateMessages
  };
};