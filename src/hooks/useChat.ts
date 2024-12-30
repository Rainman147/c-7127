import { useEffect, useRef } from 'react';
import { useMessageFlow } from './chat/useMessageFlow';
import { useMessageCache } from './chat/useMessageCache';
import { useMessageLoading } from './chat/useMessageLoading';
import { useMessageState } from './chat/useMessageState';
import { useToast } from './use-toast';
import { logger, LogCategory } from '@/utils/logging';

export const useChat = (activeSessionId: string | null) => {
  const { 
    messages = [], 
    isProcessing = false, 
    clearMessages, 
    setMessages 
  } = useMessageState();
  const { handleSendMessage } = useMessageFlow(activeSessionId);
  const { getCachedMessages, updateMessageCache, invalidateCache } = useMessageCache();
  const { loadMessages } = useMessageLoading();
  const { toast } = useToast();
  const prevSessionIdRef = useRef<string | null>(null);
  const messageCountRef = useRef(0);

  // Track message count changes
  useEffect(() => {
    if (messages.length !== messageCountRef.current) {
      logger.info(LogCategory.STATE, 'useChat', 'Message count changed:', {
        previousCount: messageCountRef.current,
        newCount: messages.length,
        messageIds: messages.map(m => m.id),
        processingState: isProcessing,
        sessionId: activeSessionId,
        timestamp: new Date().toISOString()
      });
      messageCountRef.current = messages.length;
    }
  }, [messages.length, isProcessing, activeSessionId]);

  useEffect(() => {
    if (activeSessionId === prevSessionIdRef.current) {
      logger.debug(LogCategory.STATE, 'useChat', 'Session ID unchanged, skipping load:', {
        activeSessionId,
        previousSessionId: prevSessionIdRef.current,
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.info(LogCategory.STATE, 'useChat', 'Active session changed:', {
      activeSessionId,
      previousSessionId: prevSessionIdRef.current,
      currentMessagesCount: messages.length,
      timestamp: new Date().toISOString()
    });

    prevSessionIdRef.current = activeSessionId;

    if (!activeSessionId) {
      logger.debug(LogCategory.STATE, 'useChat', 'No active session, clearing messages');
      clearMessages();
      return;
    }

    const loadSessionMessages = async () => {
      const startTime = performance.now();
      
      try {
        logger.info(LogCategory.STATE, 'useChat', 'Starting message load:', {
          sessionId: activeSessionId,
          startTime: new Date().toISOString()
        });

        const cachedMessages = getCachedMessages(activeSessionId);
        if (cachedMessages) {
          logger.info(LogCategory.STATE, 'useChat', 'Using cached messages:', {
            sessionId: activeSessionId,
            messageCount: cachedMessages.length,
            messageIds: cachedMessages.map(m => m.id),
            loadDuration: performance.now() - startTime,
            timestamp: new Date().toISOString()
          });
          setMessages(cachedMessages);
          return;
        }

        logger.debug(LogCategory.STATE, 'useChat', 'Cache miss, loading from database:', {
          sessionId: activeSessionId,
          timestamp: new Date().toISOString()
        });

        const loadedMessages = await loadMessages(activeSessionId);
        updateMessageCache(activeSessionId, loadedMessages);
        setMessages(loadedMessages);
        
        logger.info(LogCategory.STATE, 'useChat', 'Messages loaded and cached:', {
          sessionId: activeSessionId,
          messageCount: loadedMessages.length,
          messageIds: loadedMessages.map(m => m.id),
          performance: {
            totalDuration: performance.now() - startTime,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        logger.error(LogCategory.ERROR, 'useChat', 'Error loading messages:', {
          sessionId: activeSessionId,
          error,
          stack: error instanceof Error ? error.stack : undefined,
          performance: {
            failureDuration: performance.now() - startTime,
            timestamp: new Date().toISOString()
          }
        });
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive"
        });
      }
    };

    loadSessionMessages();
  }, [activeSessionId, messages.length, clearMessages, getCachedMessages, loadMessages, 
      updateMessageCache, setMessages, toast]);

  return {
    messages,
    isLoading: isProcessing,
    handleSendMessage
  };
};

export default useChat;