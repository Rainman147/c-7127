import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMessagePersistence } from './useMessagePersistence';
import type { Message } from '@/types/chat';

const MESSAGES_PER_BATCH = 50;

export const useMessageLoading = () => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { toast } = useToast();
  const { loadChatMessages } = useMessagePersistence();

  const loadMessages = async (
    chatId: string,
    updateCache: (chatId: string, messages: Message[]) => void
  ) => {
    try {
      console.log('[useMessageLoading] Loading messages for chat:', chatId);
      const loadedMessages = await loadChatMessages(chatId, MESSAGES_PER_BATCH);
      updateCache(chatId, loadedMessages);
      return loadedMessages;
    } catch (error) {
      console.error('[useMessageLoading] Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
      return [];
    }
  };

  const loadMoreMessages = async (
    chatId: string,
    currentMessages: Message[],
    setMessages: (messages: Message[]) => void,
    updateCache: (chatId: string, messages: Message[]) => void
  ) => {
    if (!chatId || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      console.log('[useMessageLoading] Loading more messages, current count:', currentMessages.length);
      
      const olderMessages = await loadChatMessages(
        chatId,
        MESSAGES_PER_BATCH,
        currentMessages.length
      );

      if (olderMessages.length > 0) {
        const updatedMessages = [...currentMessages, ...olderMessages];
        setMessages(updatedMessages);
        updateCache(chatId, updatedMessages);
      }
    } catch (error) {
      console.error('[useMessageLoading] Error loading more messages:', error);
      toast({
        title: "Error",
        description: "Failed to load more messages",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    loadMessages,
    loadMoreMessages,
    isLoadingMore
  };
};