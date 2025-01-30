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
    console.log('[DEBUG][useChat] Starting message send:', { 
      content, 
      type, 
      currentChatId,
      isLoading,
      messageCount: messages.length
    });
    
    await sendMessage(content, type, currentChatId, setMessages, setIsLoading, setMessageError);
    
    console.log('[DEBUG][useChat] Message send complete:', {
      currentChatId,
      isLoading,
      hasError: !!messageError
    });
  };

  const loadInitialMessages = async (chatId: string) => {
    console.log('[DEBUG][useChat] Loading initial messages:', { 
      chatId,
      currentChatId,
      existingMessages: messages.length 
    });
    
    await loadInitial(
      chatId,
      setMessages,
      setIsLoading,
      setCurrentChatId,
      setMessageError,
      setPage,
      setHasMore
    );
    
    console.log('[DEBUG][useChat] Initial load complete:', {
      newCurrentChatId: currentChatId,
      messageCount: messages.length,
      hasError: !!messageError
    });
  };

  const clearMessages = () => {
    console.log('[DEBUG][useChat] Clearing messages:', {
      previousCount: messages.length,
      currentChatId
    });
    clear(setMessages, setMessageError, setPage, setHasMore);
  };

  const handleLoadMore = async () => {
    console.log('[DEBUG][useChat] Loading more messages:', {
      currentChatId,
      currentPage: page,
      hasMore,
      currentCount: messages.length
    });
    
    await loadMoreMessages(currentChatId, messages, setMessages, setIsLoading);
    
    console.log('[DEBUG][useChat] Load more complete:', {
      newCount: messages.length,
      stillHasMore: hasMore
    });
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