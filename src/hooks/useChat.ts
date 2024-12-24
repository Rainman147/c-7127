import { useCallback, useEffect, useRef } from 'react';
import { useMessageState } from './chat/useMessageState';
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
  const messageUpdateTimeRef = useRef<number>(Date.now());

  const { handleMessagesLoad } = useMessageLoader(loadMessages, getCachedMessages, updateCache);
  const { handleSendMessage: messageSender } = useMessageSender(sendMessage, updateCache);

  // Enhanced real-time message handling with debouncing and deduplication
  useRealtimeMessages(
    activeSessionId,
    (newMessage: Message) => {
      const currentTime = Date.now();
      // Prevent rapid updates (debounce)
      if (currentTime - messageUpdateTimeRef.current < 100) {
        logger.debug(LogCategory.STATE, 'useChat', 'Skipping rapid update:', {
          messageId: newMessage.id,
          timeSinceLastUpdate: currentTime - messageUpdateTimeRef.current
        });
        return;
      }

      setMessages(prev => {
        // Check for duplicates
        const isDuplicate = prev.some(msg => msg.id === newMessage.id);
        if (isDuplicate) {
          logger.debug(LogCategory.STATE, 'useChat', 'Skipping duplicate message:', {
            messageId: newMessage.id
          });
          return prev;
        }

        logger.debug(LogCategory.STATE, 'useChat', 'Adding new message:', {
          messageId: newMessage.id,
          currentCount: prev.length
        });
        messageUpdateTimeRef.current = currentTime;
        return [...prev, newMessage];
      });
    }
  );

  useEffect(() => {
    if (activeSessionId === prevSessionIdRef.current) {
      return;
    }

    logger.info(LogCategory.STATE, 'useChat', 'Active session changed:', { 
      activeSessionId,
      previousSessionId: prevSessionIdRef.current
    });
    
    prevSessionIdRef.current = activeSessionId;
    
    if (!activeSessionId) {
      logger.debug(LogCategory.STATE, 'useChat', 'No active session, clearing messages');
      clearMessages();
      return;
    }

    handleMessagesLoad(activeSessionId, updateMessages);
  }, [activeSessionId, handleMessagesLoad, clearMessages, updateMessages]);

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
      type 
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

      return result;
    } catch (error) {
      logger.error(LogCategory.ERROR, 'useChat', 'Error sending message:', error);
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

  return {
    messages,
    isLoading,
    isLoadingMore,
    handleSendMessage,
    loadMoreMessages: useCallback(() => 
      loadMoreMessages(activeSessionId, messages, setMessages, updateCache),
      [activeSessionId, messages, loadMoreMessages, updateCache, setMessages]
    ),
    setMessages
  };
};

export default useChat;