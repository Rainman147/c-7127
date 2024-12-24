import { useCallback, useEffect, useRef } from 'react';
import { useMessageState } from './chat/useMessageState';
import { useMessageQuery } from './chat/useMessageQuery';
import { useMessageSender } from './chat/useMessageSender';
import { useMessageHandling } from './chat/useMessageHandling';
import { useRealtimeMessages } from './chat/useRealtimeMessages';
import { useRealtimeSync } from './chat/useRealtimeSync';
import { useToast } from './use-toast';
import { ErrorTracker } from '@/utils/errorTracking';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useChat = (activeSessionId: string | null) => {
  const { messages, setMessages, addOptimisticMessage, replaceOptimisticMessage } = useMessageState();
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { toast } = useToast();
  const retryCountRef = useRef(0);
  
  const {
    messages: queryMessages,
    isLoading: isLoadingMessages,
    addMessage,
    updateMessage
  } = useMessageQuery(activeSessionId);

  const handleError = useCallback((error: Error) => {
    ErrorTracker.trackError(error, {
      component: 'useChat',
      timestamp: new Date().toISOString(),
      errorType: error.name,
      severity: 'medium',
      retryCount: retryCountRef.current,
      additionalInfo: {
        activeSessionId,
        messageCount: messages.length
      }
    });

    toast({
      title: "Error",
      description: "An error occurred. Please try again.",
      variant: "destructive"
    });
  }, [activeSessionId, messages.length, toast]);

  const { handleNewMessage, cleanup: cleanupRealtimeSync } = useRealtimeSync({
    setMessages,
    onError: handleError,
    retryConfig: {
      retryDelay: ErrorTracker.getBackoffDelay(retryCountRef.current),
      maxRetries: 5
    }
  });

  useRealtimeMessages(activeSessionId, handleNewMessage);

  // Sync messages from React Query to local state
  useEffect(() => {
    if (queryMessages) {
      setMessages(queryMessages);
    }
  }, [queryMessages, setMessages]);

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text'
  ) => {
    if (!content.trim() || !activeSessionId) return;

    logger.info(LogCategory.COMMUNICATION, 'useChat', 'Sending message:', { 
      contentLength: content.length,
      type,
      retryCount: retryCountRef.current
    });

    const optimisticMessage = addOptimisticMessage(content, type);

    try {
      const newMessage = await addMessage.mutateAsync({
        chat_id: activeSessionId,
        content,
        type,
        sender: 'user',
        sequence: messages.length
      });

      replaceOptimisticMessage(optimisticMessage.id, newMessage);
      retryCountRef.current = 0;
      return newMessage;
    } catch (error) {
      logger.error(LogCategory.ERROR, 'useChat', 'Error sending message:', error);
      handleError(error as Error);
      throw error;
    }
  }, [
    activeSessionId,
    messages.length,
    addMessage,
    addOptimisticMessage,
    replaceOptimisticMessage,
    handleError
  ]);

  useEffect(() => {
    return () => {
      cleanupRealtimeSync();
    };
  }, [cleanupRealtimeSync]);

  return {
    messages,
    isLoading: isLoading || isLoadingMessages,
    handleSendMessage,
    setMessages
  };
};

export default useChat;