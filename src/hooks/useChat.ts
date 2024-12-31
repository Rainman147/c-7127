import { useState, useEffect } from 'react';
import { useMessageHandling } from './chat/useMessageHandling';
import { useMessagePersistence } from './chat/useMessagePersistence';
import type { Message } from '@/types/chat';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { loadChatMessages } = useMessagePersistence();

  useEffect(() => {
    return () => {
      // Cleanup function remains the same
      const controller = new AbortController();
      controller.abort();
    };
  }, []);

  const handleLoadChatMessages = async (chatId: string) => {
    console.log('[useChat] Loading messages for chat:', chatId);
    const loadedMessages = await loadChatMessages(chatId);
    setMessages(loadedMessages);
    setCurrentChatId(chatId);
  };

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