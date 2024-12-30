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

  logger.debug(LogCategory.STATE, 'MessageState', 'Hook state:', {
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
      isOptimistic: m.isOptimistic,
      created_at: m.created_at
    })),
    hookStack: new Error().stack,
    hookTime: performance.now(),
    timestamp: new Date().toISOString()
  });

  const addOptimisticMessage = useCallback((content: string, type: 'text' | 'audio' = 'text') => {
    const messageId = `temp-${Date.now()}`;
    logger.debug(LogCategory.STATE, 'MessageState', 'Adding optimistic message:', {
      messageId,
      contentPreview: content?.substring(0, 50),
      type,
      currentMessageCount: messages.length,
      timestamp: new Date().toISOString()
    });

    const optimisticMessage: Message = {
      id: messageId,
      role: 'user',
      content,
      type,
      sequence: messages.length,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      status: 'sending'
    };

    logger.info(LogCategory.STATE, 'MessageState', 'Created optimistic message:', {
      messageId: optimisticMessage.id,
      sequence: optimisticMessage.sequence,
      timestamp: new Date().toISOString()
    });

    addMessage(optimisticMessage);
    return optimisticMessage;
  }, [messages.length, addMessage]);

  const setMessagesWithLogging = useCallback((newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    const startTime = performance.now();
    
    logger.info(LogCategory.STATE, 'MessageState', 'Setting messages:', {
      messageCount: typeof newMessages === 'function' ? 'using updater function' : newMessages.length,
      messageDetails: (typeof newMessages === 'function' ? messages : newMessages).map(m => ({
        id: m.id,
        role: m.role,
        contentPreview: m.content?.substring(0, 50),
        sequence: m.sequence,
        status: m.status,
        created_at: m.created_at
      })),
      startTime: new Date().toISOString()
    });
    
    if (typeof newMessages === 'function') {
      const updatedMessages = newMessages(messages);
      contextSetMessages(updatedMessages);
      
      logger.debug(LogCategory.STATE, 'MessageState', 'Messages updated with function:', {
        previousCount: messages.length,
        newCount: updatedMessages.length,
        duration: performance.now() - startTime
      });
    } else {
      contextSetMessages(newMessages);
      
      logger.debug(LogCategory.STATE, 'MessageState', 'Messages set directly:', {
        previousCount: messages.length,
        newCount: newMessages.length,
        duration: performance.now() - startTime
      });
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