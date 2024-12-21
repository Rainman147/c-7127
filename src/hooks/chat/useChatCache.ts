import { useRef } from 'react';
import type { Message } from '@/types/chat';

type MessageCache = {
  [chatId: string]: {
    messages: Message[];
    lastFetched: number;
  };
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useChatCache = () => {
  const messageCache = useRef<MessageCache>({});

  const getCachedMessages = (chatId: string) => {
    const cachedData = messageCache.current[chatId];
    const now = Date.now();
    
    if (cachedData && (now - cachedData.lastFetched) < CACHE_DURATION) {
      console.log('[useChatCache] Cache hit for chat:', chatId);
      return cachedData.messages;
    }
    
    return null;
  };

  const updateCache = (chatId: string, messages: Message[]) => {
    console.log('[useChatCache] Updating cache for chat:', chatId);
    messageCache.current[chatId] = {
      messages,
      lastFetched: Date.now()
    };
  };

  return {
    getCachedMessages,
    updateCache
  };
};