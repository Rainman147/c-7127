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
      currentMessageCount: messages?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!content.trim()) {
      logger.debug(LogCategory.STATE, 'MessageFlow', 'Empty message, ignoring');
      return;
    }

    const flowStartTime = performance.now();
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      type,
      role: 'user',
      isOptimistic: true,
      status: 'sending',
      created_at: new Date().toISOString(),
      chat_id: activeSessionId || '',
      sequence: messages?.length || 0
    };

    const addedMessage = addOptimisticMessage(optimisticMessage);
    
    if (!addedMessage) {
      logger.error(LogCategory.STATE, 'MessageFlow', 'Failed to add optimistic message');
      return;
    }
    
    logger.debug(LogCategory.STATE, 'MessageFlow', 'Created optimistic message:', {
      flowId,
      messageId: addedMessage.id,
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
          msg.id === addedMessage.id ? data : msg
        ));
      }

    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageFlow', 'Message failed:', {
        flowId,
        messageId: addedMessage.id,
        error,
        flowDuration: performance.now() - flowStartTime
      });
      if (handleMessageFailure) {
        handleMessageFailure(addedMessage.id, error as string);
      }
    }
  }, [activeSessionId, addOptimisticMessage, handleMessageFailure, setMessages, messages, ensureActiveSession]);

  return {
    handleSendMessage
  };
};