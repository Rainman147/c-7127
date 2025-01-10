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

  // Load messages when currentChatId changes
  useEffect(() => {
    console.log('[useChat] Effect triggered with currentChatId:', currentChatId);
    
    if (!currentChatId) {
      console.log('[useChat] No chat ID, skipping message load');
      return;
    }

    let isSubscribed = true;
    
    const loadChatMessages = async () => {
      console.log('[useChat] Loading messages for chat:', currentChatId);
      try {
        const loadedMessages = await loadMessages(currentChatId);
        console.log('[useChat] Successfully loaded messages:', loadedMessages.length);
        
        // Only update state if component is still mounted
        if (isSubscribed) {
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('[useChat] Error loading chat messages:', error);
        if (isSubscribed) {
          toast({
            title: "Error loading messages",
            description: "Failed to load chat messages. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    loadChatMessages();

    // Cleanup function
    return () => {
      console.log('[useChat] Cleaning up effect for chat:', currentChatId);
      isSubscribed = false;
    };
  }, [currentChatId, loadMessages, toast]); 

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    console.log('[useChat] Sending message:', { content, type, systemInstructions });
    try {
      // Only create a new session if we don't have a chat ID
      if (!currentChatId) {
        console.log('[useChat] Creating new session for first message');
        const sessionId = await createSession('New Chat');
        if (sessionId) {
          console.log('[useChat] Created new session:', sessionId);
          setCurrentChatId(sessionId);
          navigate(`/c/${sessionId}`);
          // Wait for navigation and state update
          await new Promise(resolve => setTimeout(resolve, 100));
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
    loadChatMessages: loadMessages,
    setMessages,
    currentChatId,
    setCurrentChatId
  };
};