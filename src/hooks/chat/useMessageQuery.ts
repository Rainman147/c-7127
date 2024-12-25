import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import type { DatabaseMessage } from '@/types/database/messages';

const MESSAGES_PER_PAGE = 50;

interface FetchMessagesOptions {
  chatId: string;
  limit?: number;
  cursor?: number;
}

const mapDatabaseMessageToMessage = (dbMessage: DatabaseMessage): Message => ({
  id: dbMessage.id,
  role: dbMessage.sender as 'user' | 'assistant',
  content: dbMessage.content,
  type: dbMessage.type as 'text' | 'audio',
  sequence: dbMessage.sequence,
  created_at: dbMessage.created_at
});

async function fetchMessages({ chatId, limit = MESSAGES_PER_PAGE, cursor }: FetchMessagesOptions) {
  try {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('sequence', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('sequence', cursor);
    }

    const { data, error } = await query;

    if (error) {
      logger.error(LogCategory.DATABASE, 'MessageQuery', 'Error fetching messages:', {
        error,
        chatId,
        cursor,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    return (data || []).map(mapDatabaseMessageToMessage);
  } catch (error) {
    logger.error(LogCategory.DATABASE, 'MessageQuery', 'Failed to fetch messages:', {
      error,
      chatId,
      cursor,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export function useMessageQuery(chatId: string | undefined) {
  const query = useInfiniteQuery({
    queryKey: ['messages', chatId],
    queryFn: ({ pageParam = null }) => fetchMessages({ 
      chatId: chatId!, 
      cursor: pageParam as number | undefined 
    }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < MESSAGES_PER_PAGE) return undefined;
      return lastPage[lastPage.length - 1]?.sequence;
    },
    enabled: !!chatId,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      errorMessage: 'Failed to load messages'
    }
  });

  return {
    ...query,
    messages: query.data?.pages.flat() ?? [],
    isLoadingInitialData: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: query.fetchNextPage,
    hasMore: query.hasNextPage,
    error: query.error
  };
}