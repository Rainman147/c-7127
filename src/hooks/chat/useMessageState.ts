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

  logger.debug(LogCategory.HOOKS, 'useMessageState', 'Hook state:', {
    messageCount: messages.length,
    pendingCount: pendingMessages.length,
    confirmedCount: confirmedMessages.length,
    failedCount: failedMessages.length,
    isProcessing,
    messageDetails: messages.map(m => ({
      id: m.id,
      role: m.role,
      contentPreview: m.content?.substring(0, 50),
      sequence: m.sequence,
      status: m.status,
      isOptimistic: m.isOptimistic
    })),
    hookStack: new Error().stack,
    hookTime: performance.now()
  });

  const addOptimisticMessage = useCallback((content: string, type: 'text' | 'audio' = 'text') => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Adding optimistic message:', {
      contentPreview: content?.substring(0, 50),
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

  const setMessagesWithLogging = useCallback((newMessages: Message[]) => {
    logger.info(LogCategory.STATE, 'useMessageState', 'Setting messages:', {
      messageCount: newMessages.length,
      messageDetails: newMessages.map(m => ({
        id: m.id,
        role: m.role,
        contentPreview: m.content?.substring(0, 50),
        sequence: m.sequence,
        status: m.status
      }))
    });
    
    setMessages(newMessages);
  }, [setMessages]);

  return {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    isProcessing,
    addOptimisticMessage,
    handleMessageFailure,
    clearMessages,
    setMessages: setMessagesWithLogging
  };
};