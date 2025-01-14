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
    currentMessages: Message[] = [],
    currentChatId?: string,
    templateId?: string
  ) => {
    console.log('[useMessageHandling] Sending message:', { 
      content, 
      type, 
      chatId: currentChatId,
      templateId 
    });
    
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
      // Get template context if template ID exists
      let systemInstructions = 'Process conversation using standard format.';
      if (templateId) {
        console.log('[useMessageHandling] Fetching template:', templateId);
        const { data: template, error: templateError } = await supabase
          .from('templates')
          .select('system_instructions')
          .eq('id', templateId)
          .maybeSingle();
        
        if (templateError) {
          console.error('[useMessageHandling] Template fetch error:', templateError);
        } else if (template?.system_instructions) {
          systemInstructions = template.system_instructions;
          console.log('[useMessageHandling] Using template instructions');
        }
      }

      const userMessage: Message = { role: 'user', content, type };
      const newMessages = [...currentMessages, userMessage];

      // Save message to Supabase
      const { chatId, messageId } = await saveMessage(userMessage, currentChatId);
      userMessage.id = messageId;

      // Get patient context from chat if exists
      let patientId = null;
      if (chatId) {
        console.log('[useMessageHandling] Fetching chat context:', chatId);
        const { data: chat } = await supabase
          .from('chats')
          .select('patient_id')
          .eq('id', chatId)
          .maybeSingle();
        
        patientId = chat?.patient_id || null;
      }

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

      // Call Gemini function with context
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { 
          messages: newMessages,
          systemInstructions,
          patientId,
          messageId,
          chatId
        }
      });

      if (error) {
        console.error('[useMessageHandling] Gemini API error:', error);
        throw error;
      }
      
      if (!data) {
        console.error('[useMessageHandling] No response from Gemini API');
        throw new Error('No response from Gemini API');
      }

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
    handleSendMessage
  };
};