import { useCallback } from 'react';
import { useChatCache } from './useChatCache';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageCache = () => {
  const { getCachedMessages, updateCache, invalidateCache } = useChatCache();

  const ensureMessageIntegrity = useCallback((messages: Message[]) => {
    return messages.map((msg, index) => ({
      ...msg,
      sequence: msg.sequence ?? index,
      created_at: msg.created_at ?? new Date().toISOString()
    }));
  }, []);

  const updateMessageCache = useCallback((sessionId: string, messages: Message[]) => {
    logger.debug(LogCategory.STATE, 'useMessageCache', 'Updating cache:', {
      sessionId,
      messageCount: messages.length,
      messageDetails: messages.map(m => ({
        id: m.id,
        sequence: m.sequence,
        role: m.role,
        type: m.type
      }))
    });

    const validatedMessages = ensureMessageIntegrity(messages);
    updateCache(sessionId, validatedMessages);
  }, [ensureMessageIntegrity, updateCache]);

  return {
    getCachedMessages,
    updateMessageCache,
    invalidateCache
  };
};