import { useState } from 'react';
import type { Message } from '@/types/chat';

export const useMessageState = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addOptimisticMessage = (content: string, type: 'text' | 'audio' = 'text') => {
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      role: 'user',
      content,
      type,
      isOptimistic: true,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMessage]);
    return optimisticMessage;
  };

  const replaceOptimisticMessage = (optimisticId: string, actualMessage: Message) => {
    setMessages(prev => 
      prev.map(msg => msg.id === optimisticId ? actualMessage : msg)
    );
  };

  return {
    messages,
    setMessages,
    addOptimisticMessage,
    replaceOptimisticMessage
  };
};