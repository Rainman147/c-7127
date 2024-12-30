import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMessageState } from './useMessageState';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageFlow = (activeSessionId: string | null) => {
  const { 
    addOptimisticMessage, 
    handleMessageFailure,
    setMessages 
  } = useMessageState();
  const { ensureActiveSession } = useSessionManagement();

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text'
  ) => {
    if (!content.trim()) {
      logger.debug(LogCategory.COMMUNICATION, 'useMessageFlow', 'Empty message, ignoring');
      return;
    }

    logger.info(LogCategory.COMMUNICATION, 'useMessageFlow', 'Processing message:', {
      contentLength: content.length,
      type,
      activeSessionId,
      timestamp: new Date().toISOString()
    });

    // Create optimistic message
    const optimisticMessage = addOptimisticMessage(content, type);

    try {
      // Ensure we have an active session before sending
      let sessionId = activeSessionId;
      if (!sessionId) {
        logger.info(LogCategory.STATE, 'useMessageFlow', 'No active session, creating one');
        sessionId = await ensureActiveSession();
        
        if (!sessionId) {
          throw new Error('Failed to create session');
        }
        
        logger.info(LogCategory.STATE, 'useMessageFlow', 'Session created:', { sessionId });
      }

      logger.debug(LogCategory.COMMUNICATION, 'useMessageFlow', 'Invoking messages function:', {
        sessionId,
        messageId: optimisticMessage.id
      });

      const { data, error } = await supabase.functions.invoke('messages', {
        body: {
          content,
          type,
          sessionId
        }
      });

      if (error) throw error;

      logger.info(LogCategory.STATE, 'useMessageFlow', 'Message confirmed:', {
        tempId: optimisticMessage.id,
        confirmedId: data.id,
        sessionId
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
  }, [activeSessionId, addOptimisticMessage, handleMessageFailure, setMessages, ensureActiveSession]);

  return {
    handleSendMessage
  };
};