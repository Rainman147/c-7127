import { useRef, useCallback } from 'react';
import type { Message } from '@/types/chat';

type ChatCache = {
  [chatId: string]: {
    messages: Message[];
    timestamp: number;
  };
};

const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

export const useChatCache = () => {
  const cacheRef = useRef<ChatCache>({});

  const isCacheValid = useCallback((chatId: string): boolean => {
    const cachedData = cacheRef.current[chatId];
    if (!cachedData) {
      console.log('[useChatCache] Cache miss - no data for chat:', chatId);
      return false;
    }

    const isExpired = Date.now() - cachedData.timestamp > CACHE_EXPIRY_TIME;
    if (isExpired) {
      console.log('[useChatCache] Cache miss - expired data for chat:', chatId);
      return false;
    }

    console.log('[useChatCache] Cache hit for chat:', chatId);
    return true;
  }, []);

  const getCachedMessages = useCallback((chatId: string): Message[] | null => {
    console.log('[useChatCache] Retrieving messages for chat:', chatId);
    
    if (!isCacheValid(chatId)) {
      return null;
    }

    console.log('[useChatCache] Returning cached messages:', {
      chatId,
      messageCount: cacheRef.current[chatId].messages.length,
      timestamp: new Date(cacheRef.current[chatId].timestamp).toISOString()
    });
    
    return cacheRef.current[chatId].messages;
  }, [isCacheValid]);

  const updateCache = useCallback((chatId: string, messages: Message[]) => {
    console.log('[useChatCache] Updating cache for chat:', {
      chatId,
      messageCount: messages.length,
      sequences: messages.map(m => m.sequence)
    });
    
    cacheRef.current = {
      ...cacheRef.current,
      [chatId]: {
        messages,
        timestamp: Date.now()
      }
    };
  }, []);

  const invalidateCache = useCallback((chatId: string) => {
    console.log('[useChatCache] Invalidating cache for chat:', chatId);
    const newCache = { ...cacheRef.current };
    delete newCache[chatId];
    cacheRef.current = newCache;
  }, []);

  return {
    getCachedMessages,
    updateCache,
    invalidateCache,
    isCacheValid
  };
};