import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapDatabaseMessage } from '@/utils/chat/messageMapping';
import { MESSAGES_PER_PAGE } from './constants';

export const useMessagePagination = () => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreMessages = async (
    currentChatId: string | null,
    currentMessages: any[],
    setMessages: (messages: any[]) => void,
    setIsLoading: (loading: boolean) => void
  ) => {
    if (!currentChatId || !hasMore) return;
    
    setIsLoading(true);
    try {
      const start = page * MESSAGES_PER_PAGE;
      const end = start + MESSAGES_PER_PAGE - 1;

      const { data: newMessages, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('chat_id', currentChatId)
        .order('created_at', { ascending: true })
        .range(start, end);

      if (error) throw error;

      if (newMessages) {
        setMessages([
          ...currentMessages,
          ...newMessages.map(mapDatabaseMessage)
        ]);
        setPage(p => p + 1);
        setHasMore(count ? count > (end + 1) : false);
      }
    } catch (error: any) {
      console.error('[useMessagePagination] Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    page,
    setPage,
    hasMore,
    setHasMore,
    loadMoreMessages,
  };
};