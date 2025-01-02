import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMessageHandling } from './chat/useMessageHandling';
import { useMessagePersistence } from './chat/useMessagePersistence';
import type { Message } from '@/types/chat';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { loadChatMessages } = useMessagePersistence();
  const { toast } = useToast();

  useEffect(() => {
    console.log('[useChat] Initializing with currentChatId:', currentChatId);
    
    return () => {
      console.log('[useChat] Cleaning up chat resources');
      const controller = new AbortController();
      controller.abort();
    };
  }, []);

  const handleLoadChatMessages = useCallback(async (chatId: string) => {
    console.log('[useChat] Loading messages for chat:', chatId);
    try {
      const loadedMessages = await loadChatMessages(chatId);
      console.log('[useChat] Successfully loaded messages:', loadedMessages.length);
      setMessages(loadedMessages);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('[useChat] Error loading chat messages:', error);
      toast({
        title: "Error loading messages",
        description: "Failed to load chat messages. Please try again.",
        variant: "destructive",
      });
    }
  }, [loadChatMessages, toast]);

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    console.log('[useChat] Sending message:', { content, type, systemInstructions });
    try {
      const result = await sendMessage(
        content,
        type,
        systemInstructions,
        messages,
        currentChatId
      );

      if (result) {
        console.log('[useChat] Message sent successfully:', result);
        setMessages(result.messages);
        setCurrentChatId(result.chatId);
      }
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [messages, currentChatId, sendMessage, toast]);

  return {
    messages,
    isLoading,
    handleSendMessage,
    loadChatMessages: handleLoadChatMessages,
    setMessages,
    currentChatId,
    setCurrentChatId
  };
};