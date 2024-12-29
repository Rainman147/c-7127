import { useCallback, useEffect, useRef, useState } from 'react';
import { useMessageState } from './chat/useMessageState';
import { useMessageLoader } from './chat/useMessageLoader';
import { useMessageSender } from './chat/useMessageSender';
import { useMessageHandling } from './chat/useMessageHandling';
import { useChatCache } from './chat/useChatCache';
import { useRealtimeMessages } from './chat/useRealtimeMessages';
import { useMessageLoading } from './chat/useMessageLoading';
import { useSessionCoordinator } from './chat/useSessionCoordinator';
import { useMessageOrchestrator } from './chat/useMessageOrchestrator';
import { useToast } from './use-toast';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useChat = (activeSessionId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { 
    pendingMessages,
    confirmedMessages,
    failedMessages,
    addMessage,
    retryMessage,
    updateMessage,
    isProcessing
  } = useMessageOrchestrator(activeSessionId);
  
  const { getCachedMessages, updateCache, invalidateCache } = useChatCache();
  const { loadMessages, loadMoreMessages, isLoadingMore } = useMessageLoading();
  const { ensureSession } = useSessionCoordinator();
  const { toast } = useToast();
  const prevSessionIdRef = useRef<string | null>(null);

  useRealtimeMessages(
    activeSessionId,
    messages,
    setMessages,
    updateCache,
    invalidateCache
  );

  const clearMessages = useCallback(() => {
    logger.debug(LogCategory.STATE, 'useChat', 'Clearing messages');
    setMessages([]);
  }, []);

  const handleMessagesLoad = useCallback(async (
    sessionId: string,
    updateMessages: (messages: Message[]) => void
  ) => {
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
  }, [getCachedMessages, loadMessages, updateCache, toast]);

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

    handleMessagesLoad(activeSessionId, setMessages);
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

    await addMessage(content, type);
  }, [activeSessionId, ensureSession, addMessage]);

  return {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    isLoading: isProcessing,
    isLoadingMore,
    handleSendMessage,
    retryMessage,
    updateMessage,
    loadMoreMessages: useCallback(() => 
      loadMoreMessages(activeSessionId, messages, setMessages, updateCache),
      [activeSessionId, messages, loadMoreMessages, updateCache]
    )
  };
};

export default useChat;