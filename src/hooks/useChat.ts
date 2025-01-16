import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSimpleMessageHandler } from './chat/useSimpleMessageHandler';
import { useMessagePersistence } from './chat/useMessagePersistence';
import { useChatSessions } from './useChatSessions';
import type { Message } from '@/types/chat';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { isLoading, sendMessage } = useSimpleMessageHandler();
  const { loadChatMessages: loadMessages } = useMessagePersistence();
  const { createSession } = useChatSessions();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[useChat] Effect triggered with currentChatId:', currentChatId);
    
    if (!currentChatId) {
      console.log('[useChat] No chat ID, skipping message load');
      setMessages([]); 
      return;
    }

    const controller = new AbortController();
    
    const loadChatMessages = async () => {
      console.log('[useChat] Loading messages for chat:', currentChatId);
      try {
        const loadedMessages = await loadMessages(currentChatId);
        console.log('[useChat] Successfully loaded messages:', loadedMessages.length);
        
        if (!controller.signal.aborted) {
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('[useChat] Error loading chat messages:', error);
        if (!controller.signal.aborted) {
          toast({
            title: "Error loading messages",
            description: "Failed to load chat messages. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    loadChatMessages();

    return () => {
      console.log('[useChat] Cleaning up effect for chat:', currentChatId);
      controller.abort();
    };
  }, [currentChatId, loadMessages, toast]);

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text'
  ) => {
    console.log('[useChat] Sending message:', { content, type });
    try {
      if (!currentChatId) {
        console.log('[useChat] Creating new session for first message');
        const sessionId = await createSession('New Chat');
        if (sessionId) {
          console.log('[useChat] Created new session:', sessionId);
          setCurrentChatId(sessionId);
          navigate(`/c/${sessionId}`);
          
          // Wait for state update
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (!currentChatId) {
        throw new Error('No chat ID available');
      }

      const result = await sendMessage(content, currentChatId, type);

      if (result) {
        const newMessages = [...messages];
        
        // Add user message
        newMessages.push({
          id: result.userMessage.id,
          role: 'user',
          content,
          type
        });

        // Add assistant message if present
        if (result.assistantMessage) {
          newMessages.push(result.assistantMessage);
        }

        console.log('[useChat] Updating messages:', newMessages.length);
        setMessages(newMessages);
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
    loadChatMessages: loadMessages,
    setMessages,
    currentChatId,
    setCurrentChatId
  };
};