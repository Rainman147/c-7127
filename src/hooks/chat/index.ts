import { useMessageState } from './useMessageState';
import { useMessagePagination, MESSAGES_PER_PAGE } from './useMessagePagination';
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
    await sendMessage(content, type, currentChatId, setMessages, setIsLoading, setMessageError);
  };

  const loadInitialMessages = async (chatId: string) => {
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
    clear(setMessages, setMessageError, setPage, setHasMore);
  };

  const handleLoadMore = async () => {
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