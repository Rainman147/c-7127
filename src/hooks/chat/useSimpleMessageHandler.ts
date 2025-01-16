import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types';

export const useSimpleMessageHandler = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (
    content: string,
    chatId: string,
    type: 'text' | 'audio' = 'text'
  ) => {
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
      // Save user message
      const { data: userMessage, error: saveError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: content,
          sender: 'user',
          type: type
        })
        .select()
        .single();

      if (saveError) {
        console.error('[useSimpleMessageHandler] Error saving message:', saveError);
        throw saveError;
      }

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
        throw error;
      }

      return {
        userMessage,
        assistantMessage: data?.content ? {
          role: 'assistant',
          content: data.content,
          type: 'text'
        } as Message : null
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