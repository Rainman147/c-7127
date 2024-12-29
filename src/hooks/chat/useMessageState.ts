import { useState, useCallback } from 'react';
import type { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

export const useMessageState = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const updateMessages = useCallback((newMessages: Message[]) => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Updating messages:', { 
      count: newMessages.length 
    });
    setMessages(sortMessages(newMessages));
  }, []);

  const addOptimisticMessage = useCallback((content: string, type: 'text' | 'audio' = 'text') => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Adding optimistic message:', { 
      contentLength: content.length,
      type 
    });
    
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      type,
      sequence: messages.length,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    setMessages(prev => sortMessages([...prev, optimisticMessage]));
    return optimisticMessage;
  }, [messages]);

  const replaceOptimisticMessage = useCallback((tempId: string, actualMessage: Message) => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Replacing optimistic message:', { 
      tempId,
      actualMessageId: actualMessage.id 
    });
    
    setMessages(prev => 
      sortMessages(prev.map(msg => 
        msg.id === tempId ? { ...actualMessage, isOptimistic: false } : msg
      ))
    );
  }, []);

  const clearMessages = useCallback(() => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Clearing messages');
    setMessages([]);
  }, []);

  return {
    messages,
    updateMessages,
    addOptimisticMessage,
    replaceOptimisticMessage,
    clearMessages,
    setMessages
  };
};

const sortMessages = (messages: Message[]) => {
  return [...messages].sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return (a.sequence || 0) - (b.sequence || 0);
    }
    return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
  });
};