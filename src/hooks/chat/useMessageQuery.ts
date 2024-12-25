import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useMessageOperations } from './query/useMessageOperations';
import { useMessageCache } from './query/useMessageCache';
import type { DatabaseMessage } from '@/types/database/messages';
import type { Message } from '@/types/chat';

const MESSAGES_PER_PAGE = 50;
const MAX_RETRIES = 3;

const mapDatabaseMessageToMessage = (dbMessage: DatabaseMessage): Message => ({
  id: dbMessage.id,
  content: dbMessage.content,
  role: dbMessage.sender as 'user' | 'assistant',
  type: dbMessage.type as 'text' | 'audio',
  sequence: dbMessage.sequence || undefined,
  created_at: dbMessage.created_at
});

export const useMessageQuery = (chatId: string | null, page = 0) => {
  const { addMessage, updateMessage } = useMessageOperations(chatId);
  const { invalidateMessages } = useMessageCache(chatId);

  const fetchMessages = async (id: string, pageParam: number): Promise<Message[]> => {
    logger.debug(LogCategory.COMMUNICATION, 'useMessageQuery', 'Fetching messages:', { 
      chatId: id,
      page: pageParam,
      limit: MESSAGES_PER_PAGE
    });
    
    const start = pageParam * MESSAGES_PER_PAGE;
    const end = start + MESSAGES_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true })
      .range(start, end);

    if (error) {
      logger.error(LogCategory.ERROR, 'useMessageQuery', 'Error fetching messages:', { 
        error,
        chatId: id,
        page: pageParam
      });
      throw error;
    }

    logger.debug(LogCategory.STATE, 'useMessageQuery', 'Messages fetched successfully:', {
      chatId: id,
      messageCount: data?.length || 0,
      page: pageParam
    });

    return (data as DatabaseMessage[]).map(mapDatabaseMessageToMessage);
  };

  const { data: messages, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useQuery({
    queryKey: ['messages', chatId, page],
    queryFn: ({ pageParam = 0 }) => chatId ? fetchMessages(chatId, pageParam) : Promise.resolve([]),
    enabled: !!chatId,
    staleTime: 1000 * 30, // Cache valid for 30 seconds
    gcTime: 1000 * 60 * 5, // Keep in garbage collection for 5 minutes
    retry: MAX_RETRIES,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
    meta: {
      errorHandler: (error: Error) => {
        logger.error(LogCategory.ERROR, 'useMessageQuery', 'Query error:', {
          error,
          chatId,
          page
        });
      }
    },
    keepPreviousData: true, // Keep showing old data while fetching new data
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true // Refetch when reconnecting
  });

  return {
    messages: messages || [],
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    addMessage,
    updateMessage,
    invalidateMessages
  };
};