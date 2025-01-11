import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMessages, useSendMessage, useChatSession } from './chat';
import { useChatSessions } from './useChatSessions';
import type { Message } from '@/types/message';

export const useChat = () => {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { createSession } = useChatSessions();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use TanStack Query hooks with optimistic updates
  const { 
    data: messages = [], 
    isPending: isMessagesLoading,
    error: messagesError,
    refetch: loadChatMessages
  } = useMessages(currentChatId);
  
  const { 
    data: currentSession,
    isPending: isSessionLoading,
    error: sessionError
  } = useChatSession(currentChatId);
  
  const { 
    mutate: sendMessage,
    isPending: isSending,
    error: sendError
  } = useSendMessage();

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

      if (currentChatId) {
        sendMessage(
          { content, chatId: currentChatId, type },
          {
            onSuccess: () => {
              console.log('[useChat] Message sent successfully');
            },
            onError: (error) => {
              console.error('[useChat] Error sending message:', error);
              toast({
                title: "Error sending message",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
              });
            },
          }
        );
      }
    } catch (error) {
      console.error('[useChat] Error in handleSendMessage:', error);
      toast({
        title: "Error sending message",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [currentChatId, createSession, navigate, sendMessage, toast]);

  const isLoading = isMessagesLoading || isSessionLoading || isSending;
  const error = messagesError || sessionError || sendError;

  return {
    messages,
    isLoading,
    error,
    handleSendMessage,
    currentChatId,
    setCurrentChatId,
    currentSession,
    loadChatMessages
  };
};