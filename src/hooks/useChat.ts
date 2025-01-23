import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types';

export const useChat = () => {
  console.log('[useChat] Initializing hook');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text'
  ) => {
    console.log('[useChat] Sending message:', { content, type, currentChatId });
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { 
          chatId: currentChatId,
          content,
          type
        }
      });

      if (error) throw error;

      // Handle new chat ID if provided
      if (data?.chatId) {
        console.log('[useChat] Setting new chat ID:', data.chatId);
        setCurrentChatId(data.chatId);
      }

      // Update messages from response
      if (data?.messages && Array.isArray(data.messages)) {
        console.log('[useChat] Updating messages:', data.messages);
        setMessages(prevMessages => [...prevMessages, ...data.messages]);
      }

    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, toast]);

  const loadInitialMessages = useCallback(async (chatId: string) => {
    console.log('[useChat] Loading initial messages for chat:', chatId);
    setIsLoading(true);

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (messages) {
        console.log('[useChat] Loaded messages:', messages.length);
        setMessages(messages);
      }
    } catch (error) {
      console.error('[useChat] Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: "Failed to load chat messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    messages,
    isLoading,
    handleSendMessage,
    currentChatId,
    setCurrentChatId,
    loadInitialMessages
  };
};