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
    return queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
  };

  const updateMessageInCache = (updatedMessage: Message) => {
    queryClient.setQueryData<Message[]>(['messages', chatId], (old = []) => {
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
    queryClient.setQueryData<Message[]>(['messages', chatId], (old = []) => {
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

  return {
    invalidateMessages,
    updateMessageInCache,
    addMessageToCache
  };
};