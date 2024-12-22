import { useState, useEffect, useCallback } from 'react';
import { useMessageHandling } from './chat/useMessageHandling';
import { useChatCache } from './chat/useChatCache';
import { useRealtimeMessages } from './chat/useRealtimeMessages';
import { useMessageLoading } from './chat/useMessageLoading';
import { useToast } from './use-toast';
import { useSessionCoordinator } from './chat/useSessionCoordinator';
import type { Message } from '@/types/chat';

export const useChat = (activeSessionId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { getCachedMessages, updateCache } = useChatCache();
  const { loadMessages, loadMoreMessages, isLoadingMore } = useMessageLoading();
  const { ensureSession } = useSessionCoordinator();

  // Memoize these callbacks to prevent infinite loops
  const handleCacheUpdate = useCallback((sessionId: string, newMessages: Message[]) => {
    console.log('[useChat] Updating cache for session:', sessionId);
    updateCache(sessionId, newMessages);
  }, [updateCache]);

  const handleMessagesLoad = useCallback(async (sessionId: string) => {
    console.log('[useChat] Loading messages for session:', sessionId);
    return await loadMessages(sessionId, handleCacheUpdate);
  }, [loadMessages]);

  // Set up real-time message updates
  useRealtimeMessages(activeSessionId, messages, setMessages, handleCacheUpdate);

  // Load messages when activeSessionId changes
  useEffect(() => {
    console.log('[useChat] Active session changed:', activeSessionId);
    let isMounted = true;
    
    const loadChatMessages = async () => {
      if (!activeSessionId) {
        console.log('[useChat] No active session, clearing messages');
        setMessages([]);
        return;
      }

      try {
        // Check cache first
        const cachedMessages = getCachedMessages(activeSessionId);
        if (cachedMessages && isMounted) {
          console.log('[useChat] Using cached messages for session:', activeSessionId);
          setMessages(cachedMessages);
        } else {
          console.log('[useChat] Fetching messages from database for session:', activeSessionId);
          const loadedMessages = await handleMessagesLoad(activeSessionId);
          if (isMounted) {
            console.log('[useChat] Successfully loaded messages for session:', activeSessionId);
            setMessages(loadedMessages);
          }
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

    return () => {
      isMounted = false;
      console.log('[useChat] Cleanup: Session change effect for:', activeSessionId);
    };
  }, [activeSessionId, getCachedMessages, handleMessagesLoad, toast]);

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    console.log('[useChat] Sending message:', { content, type, systemInstructions });
    
    try {
      // Ensure session exists before sending message
      const currentSessionId = activeSessionId || await ensureSession();
      if (!currentSessionId) {
        throw new Error('Failed to create or get chat session');
      }

      const result = await sendMessage(
        content,
        type,
        systemInstructions,
        messages,
        currentSessionId
      );

      if (result) {
        console.log('[useChat] Message sent successfully for session:', currentSessionId);
        setMessages(result.messages);
        handleCacheUpdate(currentSessionId, result.messages);
        return result;
      }
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    messages,
    isLoading,
    isLoadingMore,
    handleSendMessage,
    loadMoreMessages: useCallback(() => 
      loadMoreMessages(activeSessionId, messages, setMessages, handleCacheUpdate),
      [activeSessionId, messages, loadMoreMessages, handleCacheUpdate]
    ),
    setMessages
  };
};