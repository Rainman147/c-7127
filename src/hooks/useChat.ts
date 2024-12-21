import { useState, useEffect, useRef } from 'react';
import { useMessageHandling } from './chat/useMessageHandling';
import { useMessagePersistence } from './chat/useMessagePersistence';
import type { Message } from '@/types/chat';

type MessageCache = {
  [chatId: string]: {
    messages: Message[];
    lastFetched: number;
  };
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MESSAGES_PER_BATCH = 50;

/**
 * Hook for managing chat state and message operations
 * Handles loading messages, sending messages, and managing chat state
 */
export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messageCache = useRef<MessageCache>({});
  
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { loadChatMessages } = useMessagePersistence();

  // Load messages whenever the current chat ID changes
  useEffect(() => {
    if (!currentChatId) {
      console.log('[useChat] No current chat ID, clearing messages');
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      console.log('[useChat] Current chat ID changed, checking cache:', currentChatId);
      
      // Check cache first
      const cachedData = messageCache.current[currentChatId];
      const now = Date.now();
      
      if (cachedData && (now - cachedData.lastFetched) < CACHE_DURATION) {
        console.log('[useChat] Using cached messages for chat:', currentChatId);
        setMessages(cachedData.messages);
        return;
      }

      try {
        console.log('[useChat] Cache miss or expired, loading messages from DB');
        const loadedMessages = await loadChatMessages(currentChatId, MESSAGES_PER_BATCH);
        console.log('[useChat] Messages loaded:', loadedMessages.length);
        
        // Update cache
        messageCache.current[currentChatId] = {
          messages: loadedMessages,
          lastFetched: now
        };
        
        setMessages(loadedMessages);
      } catch (error) {
        console.error('[useChat] Error loading messages:', error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [currentChatId, loadChatMessages]);

  /**
   * Loads chat messages for a specific chat ID
   * @param chatId - The ID of the chat to load messages for
   */
  const handleLoadChatMessages = async (chatId: string) => {
    console.log('[useChat] Loading messages for chat:', chatId);
    const loadedMessages = await loadChatMessages(chatId);
    setMessages(loadedMessages);
    setCurrentChatId(chatId);
  };

  /**
   * Loads more messages for the current chat
   */
  const loadMoreMessages = async () => {
    if (!currentChatId || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      console.log('[useChat] Loading more messages, current count:', messages.length);
      
      const olderMessages = await loadChatMessages(
        currentChatId, 
        MESSAGES_PER_BATCH, 
        messages.length
      );

      if (olderMessages.length > 0) {
        const updatedMessages = [...messages, ...olderMessages];
        setMessages(updatedMessages);
        
        // Update cache
        messageCache.current[currentChatId] = {
          messages: updatedMessages,
          lastFetched: Date.now()
        };
      }
    } catch (error) {
      console.error('[useChat] Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  /**
   * Sends a new message in the current chat
   * @param content - The message content
   * @param type - The message type (text or audio)
   * @param systemInstructions - Optional system instructions for AI responses
   */
  const handleSendMessage = async (
    content: string, 
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    console.log('[useChat] Sending message:', { content, type, systemInstructions });
    
    const result = await sendMessage(
      content,
      type,
      systemInstructions,
      messages,
      currentChatId
    );

    console.log('[useChat] Message send result:', result);

    if (result) {
      setMessages(result.messages);
      setCurrentChatId(result.chatId);
      
      // Update cache with new message
      messageCache.current[result.chatId] = {
        messages: result.messages,
        lastFetched: Date.now()
      };
    }
  };

  return {
    messages,
    isLoading,
    isLoadingMore,
    handleSendMessage,
    loadChatMessages: handleLoadChatMessages,
    loadMoreMessages,
    setMessages,
    currentChatId,
    setCurrentChatId
  };
};