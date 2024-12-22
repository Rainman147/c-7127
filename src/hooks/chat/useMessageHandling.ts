import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

export const useMessageHandling = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string,
    existingMessages: Message[] = [],
    chatId: string
  ) => {
    console.log('[useMessageHandling] Sending message:', { 
      contentLength: content.length,
      type,
      chatId,
      existingMessagesCount: existingMessages.length 
    });

    setIsLoading(true);

    try {
      // Calculate next sequence number
      const nextSequence = existingMessages.length + 1;
      const timestamp = new Date().toISOString();

      console.log('[useMessageHandling] Calculated message metadata:', {
        sequence: nextSequence,
        timestamp
      });

      // Insert user message
      const { data: userMessage, error: userMessageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content,
          sender: 'user',
          type,
          sequence: nextSequence,
          timestamp
        })
        .select()
        .single();

      if (userMessageError) throw userMessageError;

      console.log('[useMessageHandling] User message inserted:', {
        messageId: userMessage.id,
        sequence: nextSequence
      });

      // Get updated messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('sequence', { ascending: true })
        .order('timestamp', { ascending: true });

      if (messagesError) throw messagesError;

      console.log('[useMessageHandling] Retrieved updated messages:', {
        count: messages.length,
        sequences: messages.map(m => m.sequence)
      });

      return {
        messages,
        userMessage
      };

    } catch (error) {
      console.error('[useMessageHandling] Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSendMessage
  };
};