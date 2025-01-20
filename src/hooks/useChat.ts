import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types';
import { mapDatabaseMessageToMessage } from '@/types/message';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

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

      if (error) {
        console.error('[useChat] Error from edge function:', error);
        throw error;
      }

      // Handle new chat creation
      if (!currentChatId && data?.chatId) {
        console.log('[useChat] New chat created:', data.chatId);
        setCurrentChatId(data.chatId);
        navigate(`/c/${data.chatId}`);
      }

      // Update messages from response
      if (data?.messages && Array.isArray(data.messages)) {
        console.log('[useChat] Updating messages:', data.messages);
        const mappedMessages = data.messages.map(mapDatabaseMessageToMessage);
        setMessages(prevMessages => [...prevMessages, ...mappedMessages]);
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
  }, [currentChatId, navigate, toast]);

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
        const mappedMessages = messages.map(mapDatabaseMessageToMessage);
        setMessages(mappedMessages);
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