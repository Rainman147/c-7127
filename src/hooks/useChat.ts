import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useChatSessions } from './useChatSessions';
import type { Message } from '@/types/chat';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  chatId: string | null;
}

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    chatId: null,
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createSession } = useChatSessions();

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!state.chatId) return;

    console.log('[useChat] Setting up real-time subscription for chat:', state.chatId);
    
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${state.chatId}`
        },
        (payload) => {
          console.log('[useChat] Received message update:', payload);
          
          // Handle different real-time events
          if (payload.eventType === 'INSERT') {
            setState(prev => ({
              ...prev,
              messages: [...prev.messages, payload.new as Message]
            }));
          } else if (payload.eventType === 'UPDATE') {
            setState(prev => ({
              ...prev,
              messages: prev.messages.map(msg => 
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            }));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[useChat] Cleaning up subscription for chat:', state.chatId);
      supabase.removeChannel(channel);
    };
  }, [state.chatId]);

  const handleSendMessage = async (content: string, type: 'text' | 'audio' = 'text') => {
    console.log('[useChat] Sending message:', { content, type });
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Create new chat session if needed
      if (!state.chatId) {
        console.log('[useChat] Creating new chat session');
        const sessionId = await createSession('New Chat');
        if (sessionId) {
          setState(prev => ({ ...prev, chatId: sessionId }));
          navigate(`/c/${sessionId}`);
        }
      }

      // Send message to edge function
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: state.chatId,
          message: content,
          type
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Message will be added through real-time subscription
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      setState(prev => ({ 
        ...prev, 
        error: error as Error,
        isLoading: false 
      }));
      
      toast({
        title: "Error sending message",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const setChatId = (id: string | null) => {
    console.log('[useChat] Setting chat ID:', id);
    setState(prev => ({ ...prev, chatId: id }));
  };

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    chatId: state.chatId,
    handleSendMessage,
    setChatId
  };
};