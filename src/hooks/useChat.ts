import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMessageHandling } from './chat/useMessageHandling';
import { useMessagePersistence } from './chat/useMessagePersistence';
import { useChatSessions } from './useChatSessions';
import type { Message } from '@/types/chat';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { loadChatMessages: loadMessages } = useMessagePersistence();
  const { createSession } = useChatSessions();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      const loadedMessages = await loadMessages(chatId);
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
      throw error; // Re-throw to allow handling by the component
    }
  }, [loadMessages, toast]);

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    console.log('[useChat] Sending message:', { content, type, systemInstructions });
    try {
      // If no current chat ID, create a new session before sending the message
      if (!currentChatId) {
        console.log('[useChat] Creating new session for first message');
        const sessionId = await createSession('New Chat');
        if (sessionId) {
          console.log('[useChat] Created new session:', sessionId);
          setCurrentChatId(sessionId);
          navigate(`/c/${sessionId}`);
        }
      }

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
      }
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [messages, currentChatId, sendMessage, createSession, navigate, toast]);

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