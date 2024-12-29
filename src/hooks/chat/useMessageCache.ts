import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

const messageCache = new Map<string, Message[]>();

export const useMessageCache = () => {
  const getCachedMessages = useCallback((chatId: string) => {
    logger.debug(LogCategory.STATE, 'useMessageCache', 'Checking cache:', {
      chatId,
      hasCachedData: messageCache.has(chatId),
      cachedMessageCount: messageCache.get(chatId)?.length || 0,
      timestamp: new Date().toISOString()
    });
    return messageCache.get(chatId) || null;
  }, []);

  const updateMessageCache = useCallback((chatId: string, messages: Message[]) => {
    logger.debug(LogCategory.STATE, 'useMessageCache', 'Updating cache:', {
      chatId,
      messageCount: messages.length,
      messageIds: messages.map(m => m.id),
      timestamp: new Date().toISOString()
    });
    messageCache.set(chatId, messages);
  }, []);

  const invalidateCache = useCallback((chatId: string) => {
    logger.debug(LogCategory.STATE, 'useMessageCache', 'Invalidating cache:', {
      chatId,
      hadCachedData: messageCache.has(chatId),
      timestamp: new Date().toISOString()
    });
    messageCache.delete(chatId);
  }, []);

  return {
    getCachedMessages,
    updateMessageCache,
    invalidateCache
  };
};