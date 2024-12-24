import { useCallback, useEffect, useRef } from 'react';
import { useMessageState } from './chat/useMessageState';
import { useMessageLoader } from './chat/useMessageLoader';
import { useMessageSender } from './chat/useMessageSender';
import { useMessageHandling } from './chat/useMessageHandling';
import { useChatCache } from './chat/useChatCache';
import { useRealtimeMessages } from './chat/useRealtimeMessages';
import { useMessageLoading } from './chat/useMessageLoading';
import { useSessionCoordinator } from './chat/useSessionCoordinator';
import { useRealtimeSync } from './chat/useRealtimeSync';
import { useToast } from './use-toast';
import { ErrorTracker } from '@/utils/errorTracking';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useChat = (activeSessionId: string | null) => {
  const { 
    messages, 
    updateMessages, 
    clearMessages, 
    setMessages,
    addOptimisticMessage,
    replaceOptimisticMessage 
  } = useMessageState();
  
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { getCachedMessages, updateCache, invalidateCache } = useChatCache();
  const { loadMessages, loadMoreMessages, isLoadingMore } = useMessageLoading();
  const { ensureSession } = useSessionCoordinator();
  const { toast } = useToast();
  const prevSessionIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);

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

    if (ErrorTracker.shouldRetry('useChat', error.name)) {
      const delay = ErrorTracker.getBackoffDelay(retryCountRef.current);
      retryCountRef.current += 1;
      
      setTimeout(() => {
        if (activeSessionId) {
          handleMessagesLoad(activeSessionId, updateMessages);
        }
      }, delay);
    }

    invalidateCache();
  }, [activeSessionId, messages.length, invalidateCache]);

  const { handleMessagesLoad } = useMessageLoader(loadMessages, getCachedMessages, updateCache);
  const { handleSendMessage: messageSender } = useMessageSender(sendMessage, updateCache);

  const { handleNewMessage, cleanup: cleanupRealtimeSync } = useRealtimeSync({
    setMessages,
    onError: handleError,
    config: {
      retryDelay: ErrorTracker.getBackoffDelay(retryCountRef.current),
      maxRetries: 5
    }
  });

  useRealtimeMessages(activeSessionId, handleNewMessage);

  useEffect(() => {
    if (activeSessionId === prevSessionIdRef.current) {
      return;
    }

    logger.info(LogCategory.STATE, 'useChat', 'Active session changed:', { 
      activeSessionId,
      previousSessionId: prevSessionIdRef.current,
      retryCount: retryCountRef.current
    });
    
    prevSessionIdRef.current = activeSessionId;
    retryCountRef.current = 0;
    
    if (!activeSessionId) {
      logger.debug(LogCategory.STATE, 'useChat', 'No active session, clearing messages');
      clearMessages();
      return;
    }

    handleMessagesLoad(activeSessionId, updateMessages).catch(handleError);
  }, [activeSessionId, handleMessagesLoad, clearMessages, updateMessages, handleError]);

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    if (!content.trim()) {
      return;
    }

    logger.info(LogCategory.COMMUNICATION, 'useChat', 'Sending message:', { 
      contentLength: content.length,
      type,
      retryCount: retryCountRef.current
    });
    
    const currentSessionId = activeSessionId || await ensureSession();
    if (!currentSessionId) {
      throw new Error('Failed to create or get chat session');
    }

    const optimisticMessage = addOptimisticMessage(content, type);

    try {
      const result = await messageSender(
        content,
        currentSessionId,
        messages,
        updateMessages,
        type,
        systemInstructions
      );

      if (result?.messages) {
        const actualMessage = result.messages.find(
          msg => msg.role === 'user' && msg.content === content
        );

        if (actualMessage) {
          logger.debug(LogCategory.STATE, 'useChat', 'Replacing optimistic message:', {
            tempId: optimisticMessage.id,
            actualId: actualMessage.id
          });
          replaceOptimisticMessage(optimisticMessage.id, actualMessage);
        }
      }

      retryCountRef.current = 0;
      return result;
    } catch (error) {
      logger.error(LogCategory.ERROR, 'useChat', 'Error sending message:', error);
      ErrorTracker.trackError(error as Error, {
        component: 'useChat',
        timestamp: new Date().toISOString(),
        errorType: 'SendMessageError',
        severity: 'medium',
        retryCount: retryCountRef.current,
        additionalInfo: {
          messageType: type,
          contentLength: content.length
        }
      });

      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }, [
    activeSessionId,
    ensureSession,
    messages,
    messageSender,
    updateMessages,
    addOptimisticMessage,
    replaceOptimisticMessage,
    setMessages,
    toast
  ]);

  useEffect(() => {
    return () => {
      cleanupRealtimeSync();
    };
  }, [cleanupRealtimeSync]);

  return {
    messages,
    isLoading,
    isLoadingMore,
    handleSendMessage,
    loadMoreMessages: useCallback(() => 
      loadMoreMessages(activeSessionId, messages, setMessages, updateCache)
        .catch(handleError),
      [activeSessionId, messages, loadMoreMessages, updateCache, setMessages, handleError]
    ),
    setMessages
  };
};

export default useChat;