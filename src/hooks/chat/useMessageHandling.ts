import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/message';
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
      const userMessage: Message = { 
        role: 'user', 
        content, 
        type,
        chatId: currentChatId || '',
      };
      const newMessages = [...currentMessages, userMessage];

      // Save message to Supabase
      const { chatId, messageId } = await saveMessage(userMessage, currentChatId);
      userMessage.id = messageId;

      // Call Gemini function with system instructions
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { 
          messages: newMessages,
          systemInstructions: systemInstructions 
        }
      });

      if (error) throw error;
      if (!data) throw new Error('No response from Gemini API');

      // Create and save assistant message
      if (data.content) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          type: 'text',
          chatId: chatId,
          isStreaming: false
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
      console.error('Error sending message:', error);
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