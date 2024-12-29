import { useState, useCallback } from 'react';
import { chatService } from '../api/chatService';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

export const useChatMessages = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (content: string, type: 'text' | 'audio' = 'text'): Promise<Message> => {
    setIsLoading(true);
    try {
      const userMessage = await chatService.sendMessage(chatId, content, 'user', type);
      setMessages(prev => [...prev, userMessage]);
      return userMessage;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [chatId, toast]);

  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    setIsLoading(true);
    try {
      const loadedMessages = await chatService.getMessages(chatId);
      setMessages(loadedMessages);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [chatId, toast]);

  return {
    messages,
    isLoading,
    sendMessage,
    loadMessages
  };
};