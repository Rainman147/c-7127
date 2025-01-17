import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types';

type MessageStatus = 'queued' | 'sending' | 'delivered' | 'failed';

interface MessageResponse {
  userMessage: {
    id: string;
    content: string;
    type: 'text' | 'audio';
  };
  assistantMessage: Message | null;
  status: MessageStatus;
}

export const useSimpleMessageHandler = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (
    content: string,
    chatId: string,
    type: 'text' | 'audio' = 'text'
  ): Promise<MessageResponse | null> => {
    console.log('[useSimpleMessageHandler] Sending message:', { content, chatId, type });
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return null;
    }

    setIsLoading(true);

    try {
      // Save user message with initial status
      const { data: userMessage, error: saveError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: content,
          sender: 'user',
          type: type,
          status: 'sending'
        })
        .select()
        .single();

      if (saveError) {
        console.error('[useSimpleMessageHandler] Error saving message:', saveError);
        throw saveError;
      }

      console.log('[useSimpleMessageHandler] User message saved:', userMessage);

      // Process with Gemini function
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { 
          chatId,
          messageId: userMessage.id,
          content
        }
      });

      if (error) {
        console.error('[useSimpleMessageHandler] Gemini API error:', error);
        
        // Update message status to failed
        await supabase
          .from('messages')
          .update({ status: 'failed' })
          .eq('id', userMessage.id);

        throw error;
      }

      // Update message status to delivered
      await supabase
        .from('messages')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', userMessage.id);

      console.log('[useSimpleMessageHandler] Message processed successfully:', data);

      return {
        userMessage,
        assistantMessage: data?.content ? {
          role: 'assistant',
          content: data.content,
          type: 'text'
        } as Message : null,
        status: 'delivered'
      };

    } catch (error: any) {
      console.error('[useSimpleMessageHandler] Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    sendMessage
  };
};