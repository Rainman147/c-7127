import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/chat';
import { useMessagePersistence } from './useMessagePersistence';

export const useMessageHandling = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { saveMessage } = useMessagePersistence();

  const handleSendMessage = async (
    content: string, 
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string,
    currentMessages: Message[] = [],
    currentChatId?: string
  ) => {
    console.log('[useMessageHandling] Sending message:', { content, type, systemInstructions });
    
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
      const userMessage: Message = { role: 'user', content, type };
      const newMessages = [...currentMessages, userMessage];

      // Save message to Supabase
      const { chatId, messageId } = await saveMessage(userMessage, currentChatId);
      userMessage.id = messageId;

      // Save system instructions if provided
      if (systemInstructions && currentMessages.length === 0) {
        console.log('[useMessageHandling] Saving system message');
        const systemMessage: Message = { 
          role: 'system', 
          content: systemInstructions,
          type: 'text'
        };
        const { messageId: systemMessageId } = await saveMessage(systemMessage, chatId);
        systemMessage.id = systemMessageId;
        newMessages.unshift(systemMessage);
      }

      // Call Gemini function
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { 
          messages: newMessages,
          systemInstructions,
          messageId,
          chatId
        }
      });

      if (error) throw error;
      if (!data) throw new Error('No response from Gemini API');

      // Create and save assistant message
      if (data.content) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          type: 'text'
        };
        
        const { messageId: assistantMessageId } = await saveMessage(assistantMessage, chatId);
        assistantMessage.id = assistantMessageId;
        
        return {
          messages: [...newMessages, assistantMessage],
          chatId
        };
      }

      return {
        messages: newMessages,
        chatId
      };

    } catch (error: any) {
      console.error('[useMessageHandling] Error sending message:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSendMessage
  };
};