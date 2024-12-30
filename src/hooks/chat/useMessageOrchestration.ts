import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMessageStateManager } from './useMessageStateManager';
import { useMessagePersistence } from './useMessagePersistence';
import { useMessageLifecycle } from './useMessageLifecycle';
import { logger, LogCategory } from '@/utils/logging';

export const useMessageOrchestration = (sessionId: string | null) => {
  const { toast } = useToast();
  const {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    updateMessageStates
  } = useMessageStateManager();
  
  const { saveMessage } = useMessagePersistence(sessionId);
  const { trackMessageStart, trackMessageComplete } = useMessageLifecycle(sessionId);

  const addMessage = useCallback(async (
    content: string, 
    type: 'text' | 'audio' = 'text'
  ) => {
    if (!sessionId || !content.trim()) {
      logger.error(LogCategory.STATE, 'MessageOrchestration', 'Cannot add message: invalid session ID or content');
      return;
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      content,
      type,
      role: 'user' as const,
      chat_id: sessionId,
      sequence: messages.length,
      status: 'queued' as const,
      isOptimistic: true,
      created_at: new Date().toISOString()
    };

    const transactionId = trackMessageStart(optimisticMessage);
    optimisticMessage.transactionId = transactionId;

    logger.debug(LogCategory.STATE, 'MessageOrchestration', 'Adding optimistic message:', {
      id: optimisticId,
      transactionId,
      contentLength: content.length,
      type
    });

    updateMessageStates(optimisticMessage, 'add');

    try {
      const savedMessage = await saveMessage(content, type, messages.length);
      updateMessageStates(savedMessage, 'confirm');
      trackMessageComplete(optimisticId, true);
    } catch (error: any) {
      logger.error(LogCategory.ERROR, 'MessageOrchestration', 'Error saving message:', error);
      trackMessageComplete(optimisticId, false, error.message);
      updateMessageStates(optimisticMessage, 'fail');
      
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [sessionId, messages.length, saveMessage, trackMessageStart, trackMessageComplete, updateMessageStates, toast]);

  const retryMessage = useCallback(async (messageId: string) => {
    const failedMessage = failedMessages.find(msg => msg.id === messageId);
    if (!failedMessage) return;

    logger.info(LogCategory.STATE, 'MessageOrchestration', 'Retrying message:', {
      messageId,
      sessionId
    });

    updateMessageStates(failedMessage, 'remove');
    await addMessage(failedMessage.content, failedMessage.type);
  }, [failedMessages, addMessage, updateMessageStates]);

  return {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    addMessage,
    retryMessage,
    isProcessing: pendingMessages.length > 0
  };
};