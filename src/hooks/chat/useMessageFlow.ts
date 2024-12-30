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
    setMessages,
    messages 
  } = useMessageState();
  const { ensureActiveSession } = useSessionManagement();

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text'
  ) => {
    const flowId = `flow-${Date.now()}`;
    
    logger.info(LogCategory.STATE, 'MessageFlow', 'Starting message flow:', {
      flowId,
      contentLength: content.length,
      type,
      activeSessionId,
      currentMessageCount: messages.length,
      timestamp: new Date().toISOString()
    });

    if (!content.trim()) {
      logger.debug(LogCategory.STATE, 'MessageFlow', 'Empty message, ignoring');
      return;
    }

    const flowStartTime = performance.now();
    const optimisticMessage = addOptimisticMessage(content, type);
    
    logger.debug(LogCategory.STATE, 'MessageFlow', 'Created optimistic message:', {
      flowId,
      messageId: optimisticMessage.id,
      messageCount: messages.length + 1,
      flowDuration: performance.now() - flowStartTime
    });

    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        logger.info(LogCategory.STATE, 'MessageFlow', 'No active session, creating one', {
          flowId,
          flowDuration: performance.now() - flowStartTime
        });
        
        sessionId = await ensureActiveSession();
        
        if (!sessionId) {
          throw new Error('Failed to create session');
        }
        
        logger.info(LogCategory.STATE, 'MessageFlow', 'Session created:', { 
          flowId,
          sessionId,
          flowDuration: performance.now() - flowStartTime
        });
      }

      logger.debug(LogCategory.STATE, 'MessageFlow', 'Invoking messages function:', {
        flowId,
        sessionId,
        messageId: optimisticMessage.id,
        flowDuration: performance.now() - flowStartTime
      });

      const apiStartTime = performance.now();
      const { data, error } = await supabase.functions.invoke('messages', {
        body: {
          content,
          type,
          sessionId
        }
      });

      logger.info(LogCategory.STATE, 'MessageFlow', 'API response received:', {
        flowId,
        apiDuration: performance.now() - apiStartTime,
        success: !error,
        dataReceived: !!data,
        error: error?.message
      });

      if (error) throw error;

      logger.info(LogCategory.STATE, 'MessageFlow', 'Message confirmed:', {
        flowId,
        tempId: optimisticMessage.id,
        confirmedId: data.id,
        sessionId,
        totalDuration: performance.now() - flowStartTime
      });

      setMessages(prevMessages => {
        const updatedMessages = prevMessages.map(msg => 
          msg.id === optimisticMessage.id ? data : msg
        );
        
        logger.debug(LogCategory.STATE, 'MessageFlow', 'State updated:', {
          flowId,
          previousCount: prevMessages.length,
          newCount: updatedMessages.length,
          optimisticId: optimisticMessage.id,
          confirmedId: data.id
        });
        
        return updatedMessages;
      });

    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageFlow', 'Message failed:', {
        flowId,
        messageId: optimisticMessage.id,
        error,
        stack: error instanceof Error ? error.stack : undefined,
        flowDuration: performance.now() - flowStartTime
      });
      handleMessageFailure(optimisticMessage.id, error as string);
    }
  }, [activeSessionId, addOptimisticMessage, handleMessageFailure, setMessages, messages.length, ensureActiveSession]);

  return {
    handleSendMessage
  };
};