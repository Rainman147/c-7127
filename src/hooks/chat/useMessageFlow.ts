import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMessageState } from './useMessageState';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageFlow = (activeSessionId: string | null) => {
  const { 
    addMessage: addOptimisticMessage, 
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
      currentMessageCount: messages?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!content.trim()) {
      logger.debug(LogCategory.STATE, 'MessageFlow', 'Empty message, ignoring');
      return;
    }

    const flowStartTime = performance.now();
    const optimisticMessage = addOptimisticMessage({
      id: `temp-${Date.now()}`,
      content,
      type,
      sender: 'user',
      isOptimistic: true,
      status: 'sending',
      created_at: new Date().toISOString()
    });
    
    logger.debug(LogCategory.STATE, 'MessageFlow', 'Created optimistic message:', {
      flowId,
      messageId: optimisticMessage.id,
      messageCount: messages?.length || 0,
      flowDuration: performance.now() - flowStartTime
    });

    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        sessionId = await ensureActiveSession();
        if (!sessionId) {
          throw new Error('Failed to create session');
        }
      }

      const { data, error } = await supabase.functions.invoke('messages', {
        body: { content, type, sessionId }
      });

      if (error) throw error;

      if (setMessages && messages) {
        setMessages(messages.map(msg => 
          msg.id === optimisticMessage.id ? data : msg
        ));
      }

    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageFlow', 'Message failed:', {
        flowId,
        messageId: optimisticMessage.id,
        error,
        flowDuration: performance.now() - flowStartTime
      });
      if (handleMessageFailure) {
        handleMessageFailure(optimisticMessage.id, error as string);
      }
    }
  }, [activeSessionId, addOptimisticMessage, handleMessageFailure, setMessages, messages, ensureActiveSession]);

  return {
    handleSendMessage
  };
};