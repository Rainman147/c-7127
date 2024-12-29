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

  // Enhanced logging for message state changes
  logger.debug(LogCategory.STATE, 'useMessageState', 'Current message state:', {
    totalMessages: messages.length,
    pendingCount: pendingMessages.length,
    confirmedCount: confirmedMessages.length,
    failedCount: failedMessages.length,
    isProcessing,
    messageStatuses: messages.map(m => ({
      id: m.id,
      status: m.status,
      isOptimistic: m.isOptimistic,
      sequence: m.sequence,
      role: m.role,
      contentPreview: m.content?.substring(0, 50)
    }))
  });

  const addOptimisticMessage = useCallback((content: string, type: 'text' | 'audio' = 'text') => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Adding optimistic message:', {
      contentLength: content.length,
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

    addMessage(optimisticMessage);
    return optimisticMessage;
  }, [messages.length, addMessage]);

  const replaceOptimisticMessage = useCallback((tempId: string, confirmedMessage: Message) => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Replacing optimistic message:', {
      tempId,
      confirmedId: confirmedMessage.id,
      newStatus: confirmedMessage.status,
      sequence: confirmedMessage.sequence,
      timestamp: new Date().toISOString()
    });

    confirmMessage(tempId, {
      ...confirmedMessage,
      status: 'delivered'
    });
  }, [confirmMessage]);

  const setMessagesWithLogging = useCallback((newMessages: Message[]) => {
    logger.info(LogCategory.STATE, 'useMessageState', 'Setting messages:', {
      messageCount: newMessages.length,
      messageDetails: newMessages.map(m => ({
        id: m.id,
        role: m.role,
        status: m.status,
        sequence: m.sequence,
        contentPreview: m.content?.substring(0, 50)
      })),
      timestamp: new Date().toISOString()
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
    replaceOptimisticMessage,
    handleMessageFailure,
    clearMessages,
    setMessages: setMessagesWithLogging
  };
};