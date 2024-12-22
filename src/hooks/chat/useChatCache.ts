import { useState } from 'react';
import type { Message } from '@/types/chat';

type ChatCache = {
  [chatId: string]: Message[];
};

export const useChatCache = () => {
  const [cache, setCache] = useState<ChatCache>({});

  const getCachedMessages = (chatId: string) => {
    console.log('[useChatCache] Retrieving messages for chat:', chatId);
    return cache[chatId];
  };

  const updateCache = (chatId: string, messages: Message[]) => {
    console.log('[useChatCache] Updating cache for chat:', {
      chatId,
      messageCount: messages.length,
      sequences: messages.map(m => m.sequence)
    });
    
    setCache(prevCache => ({
      ...prevCache,
      [chatId]: messages
    }));
  };

  return {
    getCachedMessages,
    updateCache
  };
};