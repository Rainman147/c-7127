import { useState, useEffect } from 'react';
import { useMessageHandling } from './chat/useMessageHandling';
import { useChatCache } from './chat/useChatCache';
import { useRealtimeMessages } from './chat/useRealtimeMessages';
import { useMessageLoading } from './chat/useMessageLoading';
import { useToast } from './use-toast';
import type { Message } from '@/types/chat';

export const useChat = (activeSessionId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { getCachedMessages, updateCache } = useChatCache();
  const { loadMessages, loadMoreMessages, isLoadingMore } = useMessageLoading();

  // Set up real-time message updates
  useRealtimeMessages(activeSessionId, messages, setMessages, updateCache);

  // Load messages when activeSessionId changes
  useEffect(() => {
    console.log('[useChat] Active session changed:', activeSessionId);
    
    if (activeSessionId) {
      const loadChatMessages = async () => {
        console.log('[useChat] Loading messages for chat:', activeSessionId);
        try {
          // Check cache first
          const cachedMessages = getCachedMessages(activeSessionId);
          if (cachedMessages) {
            console.log('[useChat] Using cached messages');
            setMessages(cachedMessages);
          } else {
            console.log('[useChat] Fetching messages from database');
            const loadedMessages = await loadMessages(activeSessionId, updateCache);
            setMessages(loadedMessages);
          }
        } catch (error) {
          console.error('[useChat] Error loading chat messages:', error);
          toast({
            title: "Error",
            description: "Failed to load chat messages",
            variant: "destructive"
          });
        }
      };

      loadChatMessages();
    } else {
      // Clear messages when no session is selected
      console.log('[useChat] No active session, clearing messages');
      setMessages([]);
    }
  }, [activeSessionId]);

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    console.log('[useChat] Sending message:', { content, type, systemInstructions });
    
    if (!activeSessionId) {
      console.error('[useChat] No active session');
      toast({
        title: "Error",
        description: "No active chat session",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await sendMessage(
        content,
        type,
        systemInstructions,
        messages,
        activeSessionId
      );

      if (result) {
        setMessages(result.messages);
        updateCache(activeSessionId, result.messages);
      }
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  return {
    messages,
    isLoading,
    isLoadingMore,
    handleSendMessage,
    loadMoreMessages: () => 
      loadMoreMessages(activeSessionId, messages, setMessages, updateCache),
    setMessages
  };
};