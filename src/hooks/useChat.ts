import { useState, useEffect, useCallback } from 'react';
import { useMessageHandling } from './chat/useMessageHandling';
import { useChatCache } from './chat/useChatCache';
import { useRealtimeMessages } from './chat/useRealtimeMessages';
import { useMessageLoading } from './chat/useMessageLoading';
import { useToast } from './use-toast';
import { useSessionCoordinator } from './chat/useSessionCoordinator';
import type { Message } from '@/types/chat';

const sortMessages = (messages: Message[]) => {
  return [...messages].sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return (a.sequence || 0) - (b.sequence || 0);
    }
    return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
  });
};

const validateAndMergeMessages = (localMessages: Message[], newMessage: Message) => {
  console.log('[useChat] Validating new message:', { 
    messageId: newMessage.id,
    sequence: newMessage.sequence,
    created_at: newMessage.created_at
  });

  const isDuplicate = localMessages.some(msg => msg.id === newMessage.id);
  if (isDuplicate) {
    console.log('[useChat] Duplicate message detected:', newMessage.id);
    return localMessages;
  }

  return sortMessages([...localMessages, newMessage]);
};

export const useChat = (activeSessionId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { getCachedMessages, updateCache } = useChatCache();
  const { loadMessages, loadMoreMessages, isLoadingMore } = useMessageLoading();
  const { ensureSession } = useSessionCoordinator();

  const handleCacheUpdate = useCallback((sessionId: string, newMessages: Message[]) => {
    console.log('[useChat] Updating cache for session:', sessionId);
    updateCache(sessionId, sortMessages(newMessages));
  }, [updateCache]);

  const handleMessagesLoad = useCallback(async (sessionId: string) => {
    console.log('[useChat] Loading messages for session:', sessionId);
    const loadedMessages = await loadMessages(sessionId, handleCacheUpdate);
    return sortMessages(loadedMessages);
  }, [loadMessages]);

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
        const cachedMessages = getCachedMessages(activeSessionId);
        if (cachedMessages && isMounted) {
          console.log('[useChat] Using cached messages for session:', activeSessionId);
          setMessages(sortMessages(cachedMessages));
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
      const currentSessionId = activeSessionId || await ensureSession();
      if (!currentSessionId) {
        throw new Error('Failed to create or get chat session');
      }

      const result = await sendMessage(
        content,
        type,
        currentSessionId,
        messages,
        systemInstructions
      );

      if (result) {
        console.log('[useChat] Message sent successfully for session:', currentSessionId);
        const sortedMessages = sortMessages(result.messages);
        setMessages(sortedMessages);
        handleCacheUpdate(currentSessionId, sortedMessages);
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

  // Set up real-time message updates
  useRealtimeMessages(activeSessionId, messages, setMessages, handleCacheUpdate);

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