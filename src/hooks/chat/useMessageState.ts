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

  // Enhanced logging for hook initialization
  logger.debug(LogCategory.HOOKS, 'useMessageState', 'Hook initialized:', {
    hookContext: {
      timestamp: new Date().toISOString(),
      initializationStack: new Error().stack,
      performance: {
        now: performance.now()
      }
    }
  });

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
      contentPreview: m.content?.substring(0, 50),
      created_at: m.created_at,
      loadTime: Date.now(),
      stateSource: 'useMessageState'
    })),
    stateSnapshot: {
      timestamp: new Date().toISOString(),
      messageIds: messages.map(m => m.id),
      pendingIds: pendingMessages.map(m => m.id),
      confirmedIds: confirmedMessages.map(m => m.id),
      failedIds: failedMessages.map(m => m.id),
      messageSequences: messages.map(m => m.sequence),
      gaps: messages.reduce((gaps, m, i) => {
        if (i > 0 && m.sequence - messages[i-1].sequence > 1) {
          gaps.push({
            beforeId: messages[i-1].id,
            afterId: m.id,
            gap: m.sequence - messages[i-1].sequence
          });
        }
        return gaps;
      }, [] as any[])
    },
    performance: {
      timestamp: performance.now()
    }
  });

  const addOptimisticMessage = useCallback((content: string, type: 'text' | 'audio' = 'text') => {
    logger.debug(LogCategory.STATE, 'useMessageState', 'Adding optimistic message:', {
      contentLength: content.length,
      type,
      currentMessageCount: messages.length,
      timestamp: new Date().toISOString(),
      existingMessageIds: messages.map(m => m.id),
      callStack: new Error().stack
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
      timestamp: new Date().toISOString(),
      messageState: {
        beforeReplace: messages.map(m => ({
          id: m.id,
          isOptimistic: m.isOptimistic,
          sequence: m.sequence
        }))
      },
      callStack: new Error().stack
    });

    confirmMessage(tempId, {
      ...confirmedMessage,
      status: 'delivered'
    });
  }, [confirmMessage, messages]);

  const setMessagesWithLogging = useCallback((newMessages: Message[]) => {
    logger.info(LogCategory.STATE, 'useMessageState', 'Setting messages:', {
      messageCount: newMessages.length,
      messageDetails: newMessages.map(m => ({
        id: m.id,
        role: m.role,
        status: m.status,
        sequence: m.sequence,
        contentPreview: m.content?.substring(0, 50),
        created_at: m.created_at
      })),
      timestamp: new Date().toISOString(),
      operation: 'setMessages',
      source: 'useMessageState',
      callStack: new Error().stack
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
