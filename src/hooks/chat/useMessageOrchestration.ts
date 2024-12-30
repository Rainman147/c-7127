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
      count: newMessages.length,
      sessionId
    });
    setState(prev => ({
      ...prev,
      messages: newMessages,
      confirmedMessages: newMessages.filter(msg => !msg.isOptimistic)
    }));
  }, [sessionId]);

  const clearMessages = useCallback(() => {
    logger.debug(LogCategory.STATE, 'useMessageOrchestration', 'Clearing messages for session:', {
      sessionId
    });
    setState({
      messages: [],
      pendingMessages: [],
      confirmedMessages: [],
      failedMessages: [],
      isProcessing: false
    });
  }, [sessionId]);

  const addOptimisticMessage = useCallback((message: Message) => {
    logger.debug(LogCategory.STATE, 'useMessageOrchestration', 'Adding optimistic message:', {
      id: message.id,
      sessionId
    });
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      pendingMessages: [...prev.pendingMessages, message],
      isProcessing: true
    }));

    // Show toast for message sending
    toast({
      description: "Sending message...",
      duration: 2000,
    });
  }, [sessionId, toast]);

  const confirmMessage = useCallback((tempId: string, confirmedMessage: Message) => {
    logger.debug(LogCategory.STATE, 'useMessageOrchestration', 'Confirming message:', {
      tempId,
      confirmedId: confirmedMessage.id,
      sessionId
    });
    setState(prev => {
      const updatedMessages = prev.messages.map(msg => 
        msg.id === tempId ? confirmedMessage : msg
      );
      return {
        ...prev,
        messages: updatedMessages,
        pendingMessages: prev.pendingMessages.filter(msg => msg.id !== tempId),
        confirmedMessages: [...prev.confirmedMessages, confirmedMessage],
        isProcessing: prev.pendingMessages.length > 1
      };
    });
  }, [sessionId]);

  const handleMessageFailure = useCallback((messageId: string, error: any) => {
    logger.error(LogCategory.ERROR, 'useMessageOrchestration', 'Message failed:', {
      messageId,
      error,
      sessionId
    });
    setState(prev => {
      const failedMessage = prev.pendingMessages.find(msg => msg.id === messageId);
      if (!failedMessage) return prev;

      const updatedMessages = prev.messages.map(msg =>
        msg.id === messageId ? { ...msg, status: 'failed' } : msg
      );

      return {
        ...prev,
        messages: updatedMessages,
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
  }, [sessionId, toast]);

  const retryMessage = useCallback((messageId: string) => {
    logger.info(LogCategory.STATE, 'useMessageOrchestration', 'Retrying message:', {
      messageId,
      sessionId
    });
    setState(prev => {
      const messageToRetry = prev.failedMessages.find(msg => msg.id === messageId);
      if (!messageToRetry) return prev;

      const updatedMessage = { ...messageToRetry, status: 'sending' };
      const updatedMessages = prev.messages.map(msg =>
        msg.id === messageId ? updatedMessage : msg
      );

      return {
        ...prev,
        messages: updatedMessages,
        pendingMessages: [...prev.pendingMessages, updatedMessage],
        failedMessages: prev.failedMessages.filter(msg => msg.id !== messageId),
        isProcessing: true
      };
    });

    toast({
      description: "Retrying message...",
      duration: 2000,
    });
  }, [sessionId, toast]);

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