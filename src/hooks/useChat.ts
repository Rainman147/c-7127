import { useCallback, useEffect, useRef } from 'react';
import { useMessageOrchestration } from './chat/useMessageOrchestration';
import { useMessageLoader } from './chat/useMessageLoader';
import { useMessageSender } from './chat/useMessageSender';
import { useMessageHandling } from './chat/useMessageHandling';
import { useChatCache } from './chat/useChatCache';
import { useRealtimeMessages } from './chat/useRealtimeMessages';
import { useMessageLoading } from './chat/useMessageLoading';
import { useSessionCoordinator } from './chat/useSessionCoordinator';
import { useToast } from './use-toast';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useChat = (activeSessionId: string | null) => {
  const {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    isProcessing,
    updateMessages,
    clearMessages,
    addOptimisticMessage,
    confirmMessage,
    handleMessageFailure,
    retryMessage
  } = useMessageOrchestration(activeSessionId);
  
  const { getCachedMessages, updateCache, invalidateCache } = useChatCache();
  const { loadMessages, loadMoreMessages, isLoadingMore } = useMessageLoading();
  const { ensureSession } = useSessionCoordinator();
  const { toast } = useToast();
  const prevSessionIdRef = useRef<string | null>(null);

  useRealtimeMessages(
    activeSessionId,
    messages,
    updateMessages,
    updateCache,
    invalidateCache
  );

  const handleMessagesLoad = useCallback(async (sessionId: string) => {
    if (!sessionId) return;

    logger.info(LogCategory.STATE, 'useChat', 'Loading messages for session:', { sessionId });
    
    try {
      const cachedMessages = getCachedMessages(sessionId);
      if (cachedMessages) {
        updateMessages(cachedMessages);
        return;
      }

      const loadedMessages = await loadMessages(sessionId, updateCache);
      updateMessages(loadedMessages);
    } catch (error) {
      logger.error(LogCategory.ERROR, 'useChat', 'Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
    }
  }, [getCachedMessages, loadMessages, updateCache, updateMessages, toast]);

  useEffect(() => {
    if (activeSessionId === prevSessionIdRef.current) {
      return;
    }

    logger.info(LogCategory.STATE, 'useChat', 'Active session changed:', { activeSessionId });
    prevSessionIdRef.current = activeSessionId;
    
    if (!activeSessionId) {
      logger.debug(LogCategory.STATE, 'useChat', 'No active session, clearing messages');
      clearMessages();
      return;
    }

    handleMessagesLoad(activeSessionId);
  }, [activeSessionId, handleMessagesLoad, clearMessages]);

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text'
  ) => {
    if (!content.trim()) {
      return;
    }

    logger.info(LogCategory.COMMUNICATION, 'useChat', 'Sending message:', { 
      contentLength: content.length,
      type 
    });
    
    const currentSessionId = activeSessionId || await ensureSession();
    if (!currentSessionId) {
      throw new Error('Failed to create or get chat session');
    }

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      type,
      role: 'user',
      sequence: messages.length,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    addOptimisticMessage(optimisticMessage);

    try {
      const result = await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          content,
          type,
          sessionId: currentSessionId
        })
      });

      if (!result.ok) throw new Error('Failed to send message');
      
      const confirmedMessage = await result.json();
      confirmMessage(optimisticMessage.id, confirmedMessage);
    } catch (error) {
      handleMessageFailure(optimisticMessage.id, error);
    }
  }, [activeSessionId, ensureSession, messages.length, addOptimisticMessage, confirmMessage, handleMessageFailure]);

  return {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    isLoading: isProcessing,
    isLoadingMore,
    handleSendMessage,
    retryMessage,
    loadMoreMessages: useCallback(() => 
      loadMoreMessages(activeSessionId, messages, updateMessages, updateCache),
      [activeSessionId, messages, loadMoreMessages, updateCache, updateMessages]
    )
  };
};

export default useChat;