import { useState, useCallback } from 'react';
import { chatService } from '../api/chatService';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useChat = (chatId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadMessages = useCallback(async () => {
    if (!chatId) return;

    try {
      logger.debug(LogCategory.COMMUNICATION, 'useChat', 'Loading messages:', { chatId });
      const loadedMessages = await chatService.getMessages(chatId);
      setMessages(loadedMessages);
    } catch (error) {
      logger.error(LogCategory.ERROR, 'useChat', 'Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  }, [chatId, toast]);

  const sendMessage = useCallback(async (content: string, type: 'text' | 'audio' = 'text') => {
    if (!chatId || !content.trim()) return;

    setIsLoading(true);
    try {
      logger.debug(LogCategory.COMMUNICATION, 'useChat', 'Sending message:', {
        chatId,
        type,
        contentLength: content.length
      });

      // Send user message
      const userMessage = await chatService.sendMessage(chatId, content, 'user', type);
      setMessages(prev => [...prev, userMessage]);

      // Process AI response
      const aiMessage = await chatService.processAIResponse(content, chatId);
      setMessages(prev => [...prev, aiMessage]);

      logger.info(LogCategory.COMMUNICATION, 'useChat', 'Message exchange completed:', {
        userMessageId: userMessage.id,
        aiMessageId: aiMessage.id
      });
    } catch (error) {
      logger.error(LogCategory.ERROR, 'useChat', 'Error in message exchange:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
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