import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';
import type { DatabaseMessage } from '@/types/database/messages';

export const useMessageHandling = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'audio',
    chatId: string,
    existingMessages: Message[] = [],
    systemInstructions?: string
  ) => {
    console.log('[useMessageHandling] Sending message:', { 
      contentLength: content.length,
      type,
      chatId,
      existingMessagesCount: existingMessages.length 
    });

    if (!content.trim()) {
      console.error('[useMessageHandling] Empty message content');
      throw new Error('Message content cannot be empty');
    }

    if (!chatId) {
      console.error('[useMessageHandling] No chat ID provided');
      throw new Error('Chat ID is required');
    }

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

      if (userMessageError) {
        console.error('[useMessageHandling] Error inserting user message:', userMessageError);
        throw userMessageError;
      }

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

      if (messagesError) {
        console.error('[useMessageHandling] Error fetching messages:', messagesError);
        throw messagesError;
      }

      // Transform database messages to Message type
      const transformedMessages: Message[] = (messages as DatabaseMessage[]).map(msg => ({
        role: msg.sender as 'user' | 'assistant',
        content: msg.content,
        type: msg.type as 'text' | 'audio',
        id: msg.id,
        sequence: msg.sequence || messages.indexOf(msg) + 1,
        timestamp: msg.timestamp || msg.created_at
      }));

      console.log('[useMessageHandling] Retrieved updated messages:', {
        count: transformedMessages.length,
        sequences: transformedMessages.map(m => m.sequence)
      });

      return {
        messages: transformedMessages,
        userMessage: {
          role: 'user' as const,
          content: (userMessage as DatabaseMessage).content,
          type: (userMessage as DatabaseMessage).type as 'text' | 'audio',
          id: (userMessage as DatabaseMessage).id,
          sequence: (userMessage as DatabaseMessage).sequence || nextSequence,
          timestamp: (userMessage as DatabaseMessage).timestamp || timestamp
        }
      };

    } catch (error) {
      console.error('[useMessageHandling] Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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