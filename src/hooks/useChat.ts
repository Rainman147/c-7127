import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSimpleMessageHandler } from './chat/useSimpleMessageHandler';
import { useMessagePersistence } from './chat/useMessagePersistence';
import { useChatSessions } from './useChatSessions';
import type { Message } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Temporarily keep these until next refactor steps
  const { loadChatMessages } = useMessagePersistence();
  const { createSession } = useChatSessions();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Simplified message sending
  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text'
  ) => {
    console.log('[useChat] Sending message:', { content, type, currentChatId });
    setIsLoading(true);

    try {
      // Call Gemini edge function
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

      // If no chatId (new chat), update URL with the one created by backend
      if (!currentChatId && data?.chatId) {
        console.log('[useChat] New chat created:', data.chatId);
        setCurrentChatId(data.chatId);
        navigate(`/c/${data.chatId}`);
      }

      // Update messages with response
      if (data?.messages) {
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
  }, [currentChatId, navigate, toast]);

  // Keep existing message loading logic temporarily
  useEffect(() => {
    if (!currentChatId) {
      console.log('[useChat] No chat ID, skipping message load');
      setMessages([]); 
      return;
    }

    const loadChatMessages = async () => {
      try {
        const loadedMessages = await loadChatMessages(currentChatId);
        console.log('[useChat] Successfully loaded messages:', loadedMessages.length);
        setMessages(loadedMessages);
      } catch (error) {
        console.error('[useChat] Error loading chat messages:', error);
        toast({
          title: "Error loading messages",
          description: "Failed to load chat messages. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadChatMessages();
  }, [currentChatId, loadChatMessages, toast]);

  return {
    messages,
    isLoading,
    handleSendMessage,
    loadChatMessages,
    setMessages,
    currentChatId,
    setCurrentChatId
  };
};
