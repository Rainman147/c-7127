import { useState, useCallback } from 'react';
import { useMessageLifecycle } from './useMessageLifecycle';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';

export const useMessageOrchestration = (sessionId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [confirmedMessages, setConfirmedMessages] = useState<Message[]>([]);
  const [failedMessages, setFailedMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  
  const {
    trackMessageStart,
    trackMessageComplete,
    isProcessing,
    processingCount
  } = useMessageLifecycle(sessionId);

  const addMessage = useCallback(async (content: string, type: 'text' | 'audio' = 'text') => {
    if (!sessionId || !content.trim()) {
      logger.error(LogCategory.STATE, 'MessageOrchestration', 'Cannot add message: invalid session ID or content');
      return;
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      content,
      type,
      role: 'user',
      chat_id: sessionId,
      sequence: messages.length,
      isOptimistic: true,
      created_at: new Date().toISOString()
    };

    const transactionId = trackMessageStart(optimisticMessage);
    optimisticMessage.transactionId = transactionId;

    logger.debug(LogCategory.STATE, 'MessageOrchestration', 'Adding optimistic message:', {
      id: optimisticId,
      transactionId,
      contentLength: content.length,
      type
    });

    setPendingMessages(prev => [...prev, optimisticMessage]);
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data: savedMessage, error } = await supabase
        .from('messages')
        .insert({
          chat_id: sessionId,
          content,
          type,
          sender: 'user',
          sequence: messages.length
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(LogCategory.STATE, 'MessageOrchestration', 'Message saved successfully:', {
        id: savedMessage.id,
        chatId: sessionId
      });

      const confirmedMessage: Message = {
        id: savedMessage.id,
        content: savedMessage.content,
        type: savedMessage.type as 'text' | 'audio',
        role: 'user',
        sequence: savedMessage.sequence || messages.length,
        created_at: savedMessage.created_at,
        chat_id: sessionId
      };

      setMessages(prev => 
        prev.map(msg => msg.id === optimisticId ? confirmedMessage : msg)
      );
      setPendingMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      setConfirmedMessages(prev => [...prev, confirmedMessage]);

      trackMessageComplete(optimisticId, true);
    } catch (error: any) {
      logger.error(LogCategory.ERROR, 'MessageOrchestration', 'Error saving message:', error);
      trackMessageComplete(optimisticId, false, error.message);
      
      setFailedMessages(prev => [...prev, optimisticMessage]);
      setPendingMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [sessionId, messages.length, toast, trackMessageStart, trackMessageComplete]);

  const retryMessage = useCallback(async (messageId: string) => {
    const failedMessage = failedMessages.find(msg => msg.id === messageId);
    if (!failedMessage) return;

    logger.info(LogCategory.STATE, 'MessageOrchestration', 'Retrying message:', {
      messageId,
      sessionId
    });

    setFailedMessages(prev => prev.filter(msg => msg.id !== messageId));

    await addMessage(failedMessage.content, failedMessage.type);
  }, [failedMessages, addMessage]);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    if (!sessionId) return;

    logger.debug(LogCategory.STATE, 'MessageOrchestration', 'Updating message:', {
      messageId,
      contentLength: content.length
    });

    try {
      const { error } = await supabase
        .from('messages')
        .update({ content })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, content } : msg
        )
      );

      logger.info(LogCategory.STATE, 'MessageOrchestration', 'Message updated successfully:', {
        messageId
      });

    } catch (error: any) {
      logger.error(LogCategory.ERROR, 'MessageOrchestration', 'Error updating message:', error);
      
      toast({
        title: "Failed to update message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [sessionId, toast]);

  return {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    addMessage,
    retryMessage,
    updateMessage,
    isProcessing: processingCount > 0
  };
};