import { useState, useEffect } from 'react';
import { useMessageHandling } from './chat/useMessageHandling';
import { useMessagePersistence } from './chat/useMessagePersistence';
import type { Message } from '@/types/chat';

/**
 * Hook for managing chat state and message operations
 * Handles loading messages, sending messages, and managing chat state
 */
export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
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
      console.log('[useChat] Current chat ID changed, loading messages:', currentChatId);
      try {
        const loadedMessages = await loadChatMessages(currentChatId);
        console.log('[useChat] Messages loaded:', loadedMessages.length);
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
    }
  };

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