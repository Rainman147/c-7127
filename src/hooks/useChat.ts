import { useEffect, useRef } from 'react';
import { useMessageFlow } from './chat/useMessageFlow';
import { useMessageCache } from './chat/useMessageCache';
import { useMessageLoading } from './chat/useMessageLoading';
import { useMessageState } from './chat/useMessageState';
import { useToast } from './use-toast';
import { logger, LogCategory } from '@/utils/logging';

export const useChat = (activeSessionId: string | null) => {
  const { messages, isProcessing, clearMessages, setMessages } = useMessageState();
  const { handleSendMessage } = useMessageFlow(activeSessionId);
  const { getCachedMessages, updateMessageCache, invalidateCache } = useMessageCache();
  const { loadMessages } = useMessageLoading();
  const { toast } = useToast();
  const prevSessionIdRef = useRef<string | null>(null);

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

    const loadSessionMessages = async () => {
      try {
        const cachedMessages = getCachedMessages(activeSessionId);
        if (cachedMessages) {
          logger.info(LogCategory.STATE, 'useChat', 'Using cached messages:', {
            sessionId: activeSessionId,
            messageCount: cachedMessages.length
          });
          setMessages(cachedMessages);
          return;
        }

        const loadedMessages = await loadMessages(activeSessionId);
        updateMessageCache(activeSessionId, loadedMessages);
        setMessages(loadedMessages);
      } catch (error) {
        logger.error(LogCategory.ERROR, 'useChat', 'Error loading messages:', {
          sessionId: activeSessionId,
          error
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