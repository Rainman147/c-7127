import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMessages } from '@/contexts/MessageContext';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageFlow = (activeSessionId: string | null) => {
  const { 
    addMessage, 
    handleMessageFailure,
    setMessages,
    messages 
  } = useMessages();

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

    if (!content.trim() || !activeSessionId) {
      logger.error(LogCategory.STATE, 'MessageFlow', 'Invalid message or session:', {
        hasContent: !!content.trim(),
        activeSessionId
      });
      return;
    }

    const flowStartTime = performance.now();
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      type,
      role: 'user',
      chat_id: activeSessionId,
      isOptimistic: true,
      status: 'sending',
      created_at: new Date().toISOString(),
      sequence: messages?.length || 0
    };

    logger.debug(LogCategory.STATE, 'MessageFlow', 'Created optimistic message:', {
      flowId,
      messageId: optimisticMessage.id,
      messageCount: messages?.length || 0,
      flowDuration: performance.now() - flowStartTime
    });

    addMessage(optimisticMessage);

    try {
      const { data, error } = await supabase.functions.invoke('messages', {
        body: { content, type, sessionId: activeSessionId }
      });

      if (error) throw error;

      if (setMessages && messages) {
        // Preserve optimistic messages that aren't this one
        const updatedMessages = messages.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...data, chat_id: activeSessionId } 
            : msg
        );
        
        logger.debug(LogCategory.STATE, 'MessageFlow', 'Updating messages after server response:', {
          flowId,
          optimisticId: optimisticMessage.id,
          confirmedId: data.id,
          messageCount: updatedMessages.length
        });
        
        setMessages(updatedMessages);
      }

    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageFlow', 'Message failed:', {
        flowId,
        messageId: optimisticMessage.id,
        error,
        flowDuration: performance.now() - flowStartTime
      });
      handleMessageFailure(optimisticMessage.id, error as string);
    }
  }, [activeSessionId, addMessage, handleMessageFailure, setMessages, messages]);

  return {
    handleSendMessage
  };
};