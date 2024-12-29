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

  logger.debug(LogCategory.STATE, 'useMessageState', 'Current message state:', {
    totalMessages: messages.length,
    pendingCount: pendingMessages.length,
    confirmedCount: confirmedMessages.length,
    failedCount: failedMessages.length,
    isProcessing,
    messageIds: messages.map(m => m.id),
    messageSequences: messages.map(m => m.sequence),
    messageStates: messages.map(m => ({
      id: m.id,
      role: m.role,
      status: m.status,
      sequence: m.sequence,
      isOptimistic: m.isOptimistic,
      created_at: m.created_at
    }))
  });

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

    logger.info(LogCategory.STATE, 'useMessageState', 'Created optimistic message:', {
      id: optimisticMessage.id,
      sequence: optimisticMessage.sequence,
      messageState: {
        beforeCount: messages.length,
        pendingCount: pendingMessages.length
      }
    });

    addMessage(optimisticMessage);
    return optimisticMessage;
  }, [messages.length, addMessage, pendingMessages.length]);

  const replaceOptimisticMessage = useCallback((tempId: string, actualMessage: Message) => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Replacing optimistic message:', { 
      tempId,
      actualMessageId: actualMessage.id,
      messageState: {
        beforeCount: messages.length,
        pendingCount: pendingMessages.length,
        confirmedCount: confirmedMessages.length
      }
    });
    
    confirmMessage(tempId, { ...actualMessage, status: 'delivered' });

    logger.info(LogCategory.STATE, 'useMessageState', 'Message confirmed:', {
      tempId,
      actualId: actualMessage.id,
      status: 'delivered',
      afterState: {
        totalCount: messages.length,
        pendingCount: pendingMessages.length,
        confirmedCount: confirmedMessages.length
      }
    });
  }, [confirmMessage, messages.length, pendingMessages.length, confirmedMessages.length]);

  return {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    isProcessing,
    updateMessageStatus,
    addOptimisticMessage,
    replaceOptimisticMessage,
    clearMessages,
    setMessages
  };
};