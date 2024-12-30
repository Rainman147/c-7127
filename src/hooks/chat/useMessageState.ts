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
    setMessages: contextSetMessages,
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
    hookTime: performance.now(),
    timestamp: new Date().toISOString()
  });

  const addOptimisticMessage = useCallback((content: string, type: 'text' | 'audio' = 'text') => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Adding optimistic message:', {
      contentPreview: content?.substring(0, 50),
      type,
      currentMessageCount: messages.length,
      timestamp: new Date().toISOString()
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

    logger.info(LogCategory.STATE, 'useMessageState', 'Created optimistic message:', {
      messageId: optimisticMessage.id,
      sequence: optimisticMessage.sequence,
      timestamp: new Date().toISOString()
    });

    addMessage(optimisticMessage);
    return optimisticMessage;
  }, [messages.length, addMessage]);

  const setMessagesWithLogging = useCallback((newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    logger.info(LogCategory.STATE, 'useMessageState', 'Setting messages:', {
      messageCount: typeof newMessages === 'function' ? 'using updater function' : newMessages.length,
      messageDetails: (typeof newMessages === 'function' ? messages : newMessages).map(m => ({
        id: m.id,
        role: m.role,
        contentPreview: m.content?.substring(0, 50),
        sequence: m.sequence,
        status: m.status
      })),
      timestamp: new Date().toISOString()
    });
    
    if (typeof newMessages === 'function') {
      contextSetMessages(newMessages(messages));
    } else {
      contextSetMessages(newMessages);
    }
  }, [messages, contextSetMessages]);

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