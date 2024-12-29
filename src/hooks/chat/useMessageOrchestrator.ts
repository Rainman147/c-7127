import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

interface MessageOrchestrator {
  messages: Message[];
  pendingMessages: Message[];
  confirmedMessages: Message[];
  failedMessages: Message[];
  addMessage: (content: string, type?: 'text' | 'audio') => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  isProcessing: boolean;
}

export const useMessageOrchestrator = (chatId: string | null): MessageOrchestrator => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [confirmedMessages, setConfirmedMessages] = useState<Message[]>([]);
  const [failedMessages, setFailedMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const addMessage = useCallback(async (content: string, type: 'text' | 'audio' = 'text') => {
    if (!chatId || !content.trim()) {
      logger.error(LogCategory.STATE, 'MessageOrchestrator', 'Cannot add message: invalid chat ID or content');
      return;
    }

    setIsProcessing(true);
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      content,
      type,
      role: 'user',
      sequence: messages.length,
      isOptimistic: true,
      created_at: new Date().toISOString()
    };

    logger.debug(LogCategory.STATE, 'MessageOrchestrator', 'Adding optimistic message:', {
      id: optimisticId,
      contentLength: content.length,
      type
    });

    // Add to pending messages
    setPendingMessages(prev => [...prev, optimisticMessage]);
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data: savedMessage, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content,
          type,
          sender: 'user',
          sequence: messages.length
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(LogCategory.STATE, 'MessageOrchestrator', 'Message saved successfully:', {
        id: savedMessage.id,
        chatId
      });

      // Replace optimistic message with confirmed message
      const confirmedMessage: Message = {
        id: savedMessage.id,
        content: savedMessage.content,
        type: savedMessage.type as 'text' | 'audio',
        role: 'user',
        sequence: savedMessage.sequence || messages.length,
        created_at: savedMessage.created_at
      };

      setMessages(prev => 
        prev.map(msg => msg.id === optimisticId ? confirmedMessage : msg)
      );
      setPendingMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      setConfirmedMessages(prev => [...prev, confirmedMessage]);

    } catch (error: any) {
      logger.error(LogCategory.ERROR, 'MessageOrchestrator', 'Error saving message:', error);
      
      // Move message to failed messages
      setFailedMessages(prev => [...prev, optimisticMessage]);
      setPendingMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [chatId, messages.length, toast]);

  const retryMessage = useCallback(async (messageId: string) => {
    const failedMessage = failedMessages.find(msg => msg.id === messageId);
    if (!failedMessage) return;

    logger.info(LogCategory.STATE, 'MessageOrchestrator', 'Retrying failed message:', { messageId });
    
    // Remove from failed messages
    setFailedMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    // Attempt to send again
    await addMessage(failedMessage.content, failedMessage.type);
  }, [failedMessages, addMessage]);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    if (!chatId) return;

    logger.debug(LogCategory.STATE, 'MessageOrchestrator', 'Updating message:', {
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

      logger.info(LogCategory.STATE, 'MessageOrchestrator', 'Message updated successfully:', {
        messageId
      });

    } catch (error: any) {
      logger.error(LogCategory.ERROR, 'MessageOrchestrator', 'Error updating message:', error);
      
      toast({
        title: "Failed to update message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [chatId, toast]);

  return {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    addMessage,
    retryMessage,
    updateMessage,
    isProcessing
  };
};