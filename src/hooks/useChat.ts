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
  const pendingMessagesRef = useRef<Message[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { handleMessagesLoad } = useMessageLoader(loadMessages, getCachedMessages, updateCache);
  const { handleSendMessage: messageSender } = useMessageSender(sendMessage, updateCache);

  const processBatch = useCallback(() => {
    if (pendingMessagesRef.current.length === 0) return;

    const batchSize = pendingMessagesRef.current.length;
    logger.debug(LogCategory.STATE, 'useChat', 'Processing message batch:', {
      batchSize,
      timestamp: new Date().toISOString()
    });

    setMessages(prev => {
      const uniqueMessages = pendingMessagesRef.current.filter(
        newMsg => !prev.some(existingMsg => existingMsg.id === newMsg.id)
      );

      if (uniqueMessages.length === 0) {
        logger.debug(LogCategory.STATE, 'useChat', 'No new unique messages in batch');
        return prev;
      }

      logger.debug(LogCategory.STATE, 'useChat', 'Adding batch of messages:', {
        uniqueCount: uniqueMessages.length,
        totalMessages: prev.length + uniqueMessages.length
      });

      return [...prev, ...uniqueMessages];
    });

    pendingMessagesRef.current = [];
    messageUpdateTimeRef.current = Date.now();
  }, [setMessages]);

  // Enhanced real-time message handling with batching
  useRealtimeMessages(
    activeSessionId,
    (newMessage: Message) => {
      const currentTime = Date.now();
      if (currentTime - messageUpdateTimeRef.current < 50) {
        pendingMessagesRef.current.push(newMessage);
        
        logger.debug(LogCategory.STATE, 'useChat', 'Queuing message for batch:', {
          messageId: newMessage.id,
          pendingCount: pendingMessagesRef.current.length
        });

        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
        }

        batchTimeoutRef.current = setTimeout(() => {
          processBatch();
        }, 100);

        return;
      }

      // If enough time has passed, process immediately
      setMessages(prev => {
        const isDuplicate = prev.some(msg => msg.id === newMessage.id);
        if (isDuplicate) {
          logger.debug(LogCategory.STATE, 'useChat', 'Skipping duplicate message:', {
            messageId: newMessage.id
          });
          return prev;
        }

        logger.debug(LogCategory.STATE, 'useChat', 'Adding single message:', {
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

  // Cleanup batch timeout on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

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