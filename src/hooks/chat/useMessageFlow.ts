import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMessageState } from './useMessageState';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageFlow = (activeSessionId: string | null) => {
  const { 
    addOptimisticMessage, 
    handleMessageFailure,
    setMessages 
  } = useMessageState();

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text'
  ) => {
    if (!content.trim()) {
      logger.debug(LogCategory.COMMUNICATION, 'useMessageFlow', 'Empty message, ignoring');
      return;
    }

    if (!activeSessionId) {
      logger.error(LogCategory.ERROR, 'useMessageFlow', 'No active session');
      throw new Error('No active session');
    }

    logger.info(LogCategory.COMMUNICATION, 'useMessageFlow', 'Sending message:', {
      contentLength: content.length,
      type,
      activeSessionId
    });

    const optimisticMessage = addOptimisticMessage(content, type);

    try {
      logger.debug(LogCategory.COMMUNICATION, 'useMessageFlow', 'Invoking messages function:', {
        sessionId: activeSessionId,
        messageId: optimisticMessage.id
      });

      const { data, error } = await supabase.functions.invoke('messages', {
        body: {
          content,
          type,
          sessionId: activeSessionId
        }
      });

      if (error) throw error;

      logger.info(LogCategory.STATE, 'useMessageFlow', 'Message confirmed:', {
        tempId: optimisticMessage.id,
        confirmedId: data.id,
        sessionId: activeSessionId
      });

      // Replace optimistic message with confirmed message
      const updatedMessages = (prevMessages: Message[]) => 
        prevMessages.map(msg => msg.id === optimisticMessage.id ? data : msg);
      
      setMessages(updatedMessages);

    } catch (error) {
      logger.error(LogCategory.ERROR, 'useMessageFlow', 'Message failed:', {
        messageId: optimisticMessage.id,
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      handleMessageFailure(optimisticMessage.id, error as string);
    }
  }, [activeSessionId, addOptimisticMessage, handleMessageFailure, setMessages]);

  return {
    handleSendMessage
  };
};