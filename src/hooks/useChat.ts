import { useState } from 'react';
import { useMessageHandling } from './chat/useMessageHandling';
import { useChatCache } from './chat/useChatCache';
import { useRealtimeMessages } from './chat/useRealtimeMessages';
import { useMessageLoading } from './chat/useMessageLoading';
import { useToast } from './use-toast';
import type { Message } from '@/types/chat';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { getCachedMessages, updateCache } = useChatCache();
  const { loadMessages, loadMoreMessages, isLoadingMore } = useMessageLoading();

  // Set up real-time message updates
  useRealtimeMessages(currentChatId, messages, setMessages, updateCache);

  const handleLoadChatMessages = async (chatId: string) => {
    console.log('[useChat] Loading messages for chat:', chatId);
    try {
      // Check cache first
      const cachedMessages = getCachedMessages(chatId);
      if (cachedMessages) {
        setMessages(cachedMessages);
      } else {
        const loadedMessages = await loadMessages(chatId, updateCache);
        setMessages(loadedMessages);
      }
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('[useChat] Error loading chat messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    console.log('[useChat] Sending message:', { content, type, systemInstructions });
    
    try {
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
        updateCache(result.chatId, result.messages);
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
    loadChatMessages: handleLoadChatMessages,
    loadMoreMessages: (chatId: string) => 
      loadMoreMessages(chatId, messages, setMessages, updateCache),
    setMessages,
    currentChatId,
    setCurrentChatId
  };
};