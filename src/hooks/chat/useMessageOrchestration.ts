import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import type { Message, MessageStatus } from '@/types/chat';

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
    logger.debug(LogCategory.MERGE, 'useMessageOrchestration', 'Updating messages:', {
      count: newMessages.length,
      sessionId,
      messageIds: newMessages.map(m => m.id),
      messageStatuses: newMessages.map(m => ({
        id: m.id,
        status: m.status,
        isOptimistic: m.isOptimistic
      }))
    });

    setState(prev => {
      logger.merge('useMessageOrchestration', 'Previous state:', {
        messageCount: prev.messages.length,
        pendingCount: prev.pendingMessages.length,
        confirmedCount: prev.confirmedMessages.length,
        failedCount: prev.failedMessages.length
      });

      const updatedState = {
        ...prev,
        messages: newMessages,
        confirmedMessages: newMessages.filter(msg => !msg.isOptimistic)
      };

      logger.merge('useMessageOrchestration', 'Updated state:', {
        messageCount: updatedState.messages.length,
        pendingCount: updatedState.pendingMessages.length,
        confirmedCount: updatedState.confirmedMessages.length,
        failedCount: updatedState.failedMessages.length,
        changes: {
          messagesAdded: updatedState.messages.length - prev.messages.length,
          pendingChanged: updatedState.pendingMessages.length - prev.pendingMessages.length,
          confirmedChanged: updatedState.confirmedMessages.length - prev.confirmedMessages.length
        }
      });

      return updatedState;
    });
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
      sessionId,
      messageDetails: {
        type: message.type,
        role: message.role,
        status: message.status,
        contentPreview: message.content.substring(0, 50)
      }
    });

    setState(prev => {
      const updatedState = {
        ...prev,
        messages: [...prev.messages, { ...message, status: 'sending' as MessageStatus }],
        pendingMessages: [...prev.pendingMessages, message],
        isProcessing: true
      };

      logger.merge('useMessageOrchestration', 'State after optimistic update:', {
        messageCount: updatedState.messages.length,
        pendingCount: updatedState.pendingMessages.length,
        lastMessage: {
          id: message.id,
          status: 'sending',
          isOptimistic: true
        }
      });

      return updatedState;
    });

    toast({
      description: "Sending message...",
      duration: 2000,
    });
  }, [sessionId, toast]);

  const confirmMessage = useCallback((tempId: string, confirmedMessage: Message) => {
    logger.debug(LogCategory.STATE, 'useMessageOrchestration', 'Confirming message:', {
      tempId,
      confirmedId: confirmedMessage.id,
      sessionId,
      messageDetails: {
        type: confirmedMessage.type,
        role: confirmedMessage.role,
        status: confirmedMessage.status
      }
    });

    setState(prev => {
      const updatedMessages = prev.messages.map(msg => 
        msg.id === tempId ? { ...confirmedMessage, status: 'delivered' as MessageStatus } : msg
      );

      const updatedState = {
        ...prev,
        messages: updatedMessages,
        pendingMessages: prev.pendingMessages.filter(msg => msg.id !== tempId),
        confirmedMessages: [...prev.confirmedMessages, confirmedMessage],
        isProcessing: prev.pendingMessages.length > 1
      };

      logger.merge('useMessageOrchestration', 'State after message confirmation:', {
        messageCount: updatedState.messages.length,
        pendingCount: updatedState.pendingMessages.length,
        confirmedCount: updatedState.confirmedMessages.length,
        messageStatuses: updatedState.messages
          .filter(m => m.id === confirmedMessage.id || m.id === tempId)
          .map(m => ({
            id: m.id,
            status: m.status,
            isOptimistic: m.isOptimistic
          }))
      });

      return updatedState;
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
        msg.id === messageId ? { ...msg, status: 'failed' as MessageStatus } : msg
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

      const updatedMessage = { ...messageToRetry, status: 'sending' as MessageStatus };
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
