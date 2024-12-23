import { useState, useCallback } from 'react';
import type { Message } from '@/types/chat';

const sortMessages = (messages: Message[]) => {
  return [...messages].sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return (a.sequence || 0) - (b.sequence || 0);
    }
    return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
  });
};

export const useMessageState = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const updateMessages = useCallback((newMessages: Message[]) => {
    console.log('[useMessageState] Updating messages:', { count: newMessages.length });
    setMessages(sortMessages(newMessages));
  }, []);

  const clearMessages = useCallback(() => {
    console.log('[useMessageState] Clearing messages');
    setMessages([]);
  }, []);

  return {
    messages,
    updateMessages,
    clearMessages,
    setMessages
  };
};