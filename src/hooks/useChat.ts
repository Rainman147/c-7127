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
import { supabase } from '@/integrations/supabase/client';
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

    logger.info(LogCategory.STATE, 'useChat', 'Loading messages for session:', { 
      sessionId,
      prevSessionId: prevSessionIdRef.current,
      currentMessagesCount: messages.length 
    });
    
    try {
      const cachedMessages = getCachedMessages(sessionId);
      logger.debug(LogCategory.STATE, 'useChat', 'Cache check result:', { 
        sessionId,
        hasCachedMessages: !!cachedMessages,
        cachedMessagesCount: cachedMessages?.length 
      });

      if (cachedMessages) {
        logger.info(LogCategory.STATE, 'useChat', 'Using cached messages:', {
          sessionId,
          messageCount: cachedMessages.length,
          messageIds: cachedMessages.map(m => m.id),
          firstMessage: cachedMessages[0]?.content?.substring(0, 50),
          lastMessage: cachedMessages[cachedMessages.length - 1]?.content?.substring(0, 50)
        });
        updateMessages(cachedMessages);
        return;
      }

      logger.info(LogCategory.STATE, 'useChat', 'Loading messages from database:', { sessionId });
      const loadedMessages = await loadMessages(sessionId, updateCache);
      logger.debug(LogCategory.STATE, 'useChat', 'Database load complete:', {
        sessionId,
        loadedCount: loadedMessages.length,
        messageIds: loadedMessages.map(m => m.id),
        firstMessage: loadedMessages[0]?.content?.substring(0, 50),
        lastMessage: loadedMessages[loadedMessages.length - 1]?.content?.substring(0, 50)
      });

      updateMessages(loadedMessages);
    } catch (error) {
      logger.error(LogCategory.ERROR, 'useChat', 'Error loading messages:', { 
        sessionId, 
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
    }
  }, [getCachedMessages, loadMessages, updateCache, updateMessages, toast, messages.length]);

  useEffect(() => {
    if (activeSessionId === prevSessionIdRef.current) {
      return;
    }

    logger.info(LogCategory.STATE, 'useChat', 'Active session changed:', { 
      activeSessionId,
      previousSessionId: prevSessionIdRef.current,
      currentMessagesCount: messages.length
    });
    prevSessionIdRef.current = activeSessionId;
    
    if (!activeSessionId) {
      logger.debug(LogCategory.STATE, 'useChat', 'No active session, clearing messages');
      clearMessages();
      return;
    }

    handleMessagesLoad(activeSessionId);
  }, [activeSessionId, handleMessagesLoad, clearMessages, messages.length]);

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text'
  ) => {
    if (!content.trim()) {
      logger.debug(LogCategory.COMMUNICATION, 'useChat', 'Empty message, ignoring');
      return;
    }

    logger.info(LogCategory.COMMUNICATION, 'useChat', 'Sending message:', { 
      contentLength: content.length,
      type,
      activeSessionId,
      currentMessagesCount: messages.length
    });
    
    const currentSessionId = activeSessionId || await ensureSession();
    if (!currentSessionId) {
      logger.error(LogCategory.ERROR, 'useChat', 'Failed to get or create session');
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

    logger.debug(LogCategory.STATE, 'useChat', 'Adding optimistic message:', {
      messageId: optimisticMessage.id,
      sessionId: currentSessionId,
      sequence: optimisticMessage.sequence
    });

    addOptimisticMessage(optimisticMessage);

    try {
      logger.debug(LogCategory.COMMUNICATION, 'useChat', 'Invoking messages function:', {
        sessionId: currentSessionId,
        messageId: optimisticMessage.id
      });

      const { data, error } = await supabase.functions.invoke('messages', {
        body: {
          content,
          type,
          sessionId: currentSessionId
        }
      });

      if (error) throw error;
      
      logger.info(LogCategory.STATE, 'useChat', 'Message confirmed:', {
        tempId: optimisticMessage.id,
        confirmedId: data.id,
        sessionId: currentSessionId
      });

      confirmMessage(optimisticMessage.id, data);
    } catch (error) {
      logger.error(LogCategory.ERROR, 'useChat', 'Message failed:', {
        messageId: optimisticMessage.id,
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
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