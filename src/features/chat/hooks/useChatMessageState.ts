
import { useState } from 'react';
import type { Message } from '@/types';

export const useChatMessageState = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [isReady, setIsReady] = useState(false);

  return {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    loadAttempts,
    setLoadAttempts,
    isReady,
    setIsReady
  };
};
