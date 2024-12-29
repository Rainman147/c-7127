import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

interface MessageState {
  messages: Message[];
  pendingMessages: Message[];
  confirmedMessages: Message[];
  failedMessages: Message[];
  isProcessing: boolean;
}

export const useMessageOrchestration = (sessionId: string | null) => {
  const [state, setState] = useState<MessageState>({
    messages: [],
    pendingMessages: [],
    confirmedMessages: [],
    failedMessages: [],
    isProcessing: false
  });
  
  const { toast } = useToast();

  const updateMessages = useCallback((newMessages: Message[]) => {
    logger.debug(LogCategory.STATE, 'useMessageOrchestration', 'Updating messages:', {
      count: newMessages.length
    });
    setState(prev => ({
      ...prev,
      messages: newMessages,
      confirmedMessages: newMessages
    }));
  }, []);

  const clearMessages = useCallback(() => {
    logger.debug(LogCategory.STATE, 'useMessageOrchestration', 'Clearing all messages');
    setState({
      messages: [],
      pendingMessages: [],
      confirmedMessages: [],
      failedMessages: [],
      isProcessing: false
    });
  }, []);

  const addOptimisticMessage = useCallback((message: Message) => {
    logger.debug(LogCategory.STATE, 'useMessageOrchestration', 'Adding optimistic message:', {
      id: message.id
    });
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      pendingMessages: [...prev.pendingMessages, message],
      isProcessing: true
    }));
  }, []);

  const confirmMessage = useCallback((tempId: string, confirmedMessage: Message) => {
    logger.debug(LogCategory.STATE, 'useMessageOrchestration', 'Confirming message:', {
      tempId,
      confirmedId: confirmedMessage.id
    });
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => msg.id === tempId ? confirmedMessage : msg),
      pendingMessages: prev.pendingMessages.filter(msg => msg.id !== tempId),
      confirmedMessages: [...prev.confirmedMessages, confirmedMessage],
      isProcessing: prev.pendingMessages.length > 1
    }));
  }, []);

  const handleMessageFailure = useCallback((messageId: string, error: any) => {
    logger.error(LogCategory.ERROR, 'useMessageOrchestration', 'Message failed:', {
      messageId,
      error
    });
    setState(prev => {
      const failedMessage = prev.pendingMessages.find(msg => msg.id === messageId);
      if (!failedMessage) return prev;

      return {
        ...prev,
        pendingMessages: prev.pendingMessages.filter(msg => msg.id !== messageId),
        failedMessages: [...prev.failedMessages, failedMessage],
        isProcessing: prev.pendingMessages.length > 1
      };
    });

    toast({
      title: "Message Failed",
      description: "Failed to send message. Click to retry.",
      variant: "destructive",
    });
  }, [toast]);

  const retryMessage = useCallback((messageId: string) => {
    logger.info(LogCategory.STATE, 'useMessageOrchestration', 'Retrying message:', {
      messageId
    });
    setState(prev => {
      const messageToRetry = prev.failedMessages.find(msg => msg.id === messageId);
      if (!messageToRetry) return prev;

      return {
        ...prev,
        pendingMessages: [...prev.pendingMessages, messageToRetry],
        failedMessages: prev.failedMessages.filter(msg => msg.id !== messageId),
        isProcessing: true
      };
    });
  }, []);

  return {
    ...state,
    updateMessages,
    clearMessages,
    addOptimisticMessage,
    confirmMessage,
    handleMessageFailure,
    retryMessage
  };
};