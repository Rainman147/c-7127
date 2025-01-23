import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types';

// Helper function to map database message to frontend format
const mapDatabaseMessageToMessage = (dbMessage: any): Message => {
  return {
    id: dbMessage.id,
    role: dbMessage.sender === 'user' ? 'user' : 'assistant',
    content: dbMessage.content,
    type: dbMessage.type || 'text',
  };
};

export const useChat = () => {
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

      if (data?.chatId) {
        console.log('[useChat] Setting chat ID:', data.chatId);
        setCurrentChatId(data.chatId);
      }

      if (data?.messages && Array.isArray(data.messages)) {
        console.log('[useChat] Received messages:', data.messages.length);
        const mappedMessages = data.messages.map(mapDatabaseMessageToMessage);
        setMessages(mappedMessages);
      }

    } catch (error) {
      console.error('[useChat] Error:', error);
      toast({
        title: "Error sending message",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, toast]);

  const loadInitialMessages = useCallback(async (chatId: string) => {
    console.log('[useChat] Loading messages for chat:', chatId);
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
        title: "Error",
        description: "Failed to load chat messages.",
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