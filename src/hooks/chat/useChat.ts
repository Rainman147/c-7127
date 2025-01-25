import { useMessageState } from './useMessageState';
import { useMessagePagination } from './useMessagePagination';
import { useMessageOperations } from './useMessageOperations';
import type { MessageType } from '@/types/chat';

export const useChat = () => {
  const {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    messageError,
    setMessageError,
    currentChatId,
    setCurrentChatId,
  } = useMessageState();

  const {
    page,
    setPage,
    hasMore,
    setHasMore,
    loadMoreMessages,
  } = useMessagePagination();

  const {
    handleSendMessage: sendMessage,
    loadInitialMessages: loadInitial,
    clearMessages: clear,
  } = useMessageOperations();

  const handleSendMessage = async (content: string, type: MessageType = 'text') => {
    console.log('[useChat] Sending message:', { content, type });
    await sendMessage(content, type, currentChatId, setMessages, setIsLoading, setMessageError);
  };

  const loadInitialMessages = async (chatId: string) => {
    console.log('[useChat] Loading initial messages for chat:', chatId);
    await loadInitial(
      chatId,
      setMessages,
      setIsLoading,
      setCurrentChatId,
      setMessageError,
      setPage,
      setHasMore
    );
  };

  const clearMessages = () => {
    console.log('[useChat] Clearing messages');
    clear(setMessages, setMessageError, setPage, setHasMore);
  };

  const handleLoadMore = async () => {
    console.log('[useChat] Loading more messages');
    await loadMoreMessages(currentChatId, messages, setMessages, setIsLoading);
  };

  return {
    messages,
    isLoading,
    messageError,
    currentChatId,
    hasMore,
    handleSendMessage,
    loadInitialMessages,
    loadMoreMessages: handleLoadMore,
    clearMessages,
  };
};