import { useCallback } from 'react';
import { useMessages } from '@/contexts/MessageContext';
import type { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

export const useMessageState = () => {
  const {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    isProcessing,
    setMessages,
    addMessage,
    updateMessageStatus,
    confirmMessage,
    handleMessageFailure,
    clearMessages
  } = useMessages();

  const addOptimisticMessage = useCallback((content: string, type: 'text' | 'audio' = 'text') => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Adding optimistic message:', {
      contentLength: content.length,
      type,
      currentMessageCount: messages.length
    });

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      type,
      sequence: messages.length,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      status: 'sending'
    };

    addMessage(optimisticMessage);
    return optimisticMessage;
  }, [messages.length, addMessage]);

  const replaceOptimisticMessage = useCallback((tempId: string, confirmedMessage: Message) => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Replacing optimistic message:', {
      tempId,
      confirmedId: confirmedMessage.id
    });

    confirmMessage(tempId, {
      ...confirmedMessage,
      status: 'delivered'
    });
  }, [confirmMessage]);

  return {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    isProcessing,
    addOptimisticMessage,
    replaceOptimisticMessage,
    handleMessageFailure,
    clearMessages,
    setMessages
  };
};