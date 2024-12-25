import { useQueryClient } from '@tanstack/react-query';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageCache = (chatId: string | null) => {
  const queryClient = useQueryClient();

  const invalidateMessages = () => {
    logger.debug(LogCategory.CACHE, 'MessageCache', 'Invalidating messages cache:', {
      chatId,
      timestamp: new Date().toISOString()
    });
    
    // Invalidate all pages for this chat
    return queryClient.invalidateQueries({ 
      queryKey: ['messages', chatId],
      refetchType: 'active' // Only refetch active queries
    });
  };

  const updateMessageInCache = (updatedMessage: Message) => {
    // Update message in all cached pages
    queryClient.setQueriesData<Message[]>({ queryKey: ['messages', chatId] }, (old = []) => {
      const updated = old.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      );
      
      logger.debug(LogCategory.CACHE, 'MessageCache', 'Updated message in cache:', {
        messageId: updatedMessage.id,
        chatId,
        timestamp: new Date().toISOString()
      });
      
      return updated;
    });
  };

  const addMessageToCache = (newMessage: Message) => {
    // Add message to the latest page
    queryClient.setQueriesData<Message[]>({ queryKey: ['messages', chatId] }, (old = []) => {
      if (old.some(msg => msg.id === newMessage.id)) {
        return old;
      }
      
      logger.debug(LogCategory.CACHE, 'MessageCache', 'Added message to cache:', {
        messageId: newMessage.id,
        chatId,
        timestamp: new Date().toISOString()
      });
      
      return [...old, newMessage];
    });
  };

  const prefetchNextPage = async (page: number) => {
    if (!chatId) return;

    logger.debug(LogCategory.CACHE, 'MessageCache', 'Prefetching next page:', {
      chatId,
      page: page + 1,
      timestamp: new Date().toISOString()
    });

    await queryClient.prefetchQuery({
      queryKey: ['messages', chatId, page + 1],
      staleTime: 1000 * 30 // Match the staleTime from useMessageQuery
    });
  };

  return {
    invalidateMessages,
    updateMessageInCache,
    addMessageToCache,
    prefetchNextPage
  };
};