import { useEffect } from 'react';
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
    isCreatingChat,
    setIsCreatingChat,
    messageError,
    setMessageError,
    currentChatId,
    setCurrentChatId,
    updateChatId,
    handleChatCreationError,
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

  // Prevent navigation during chat creation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCreatingChat) {
        e.preventDefault();
        e.returnValue = "Chat creation in progress...";
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCreatingChat]);

  const handleSendMessage = async (content: string, type: MessageType = 'text') => {
    console.log('[DEBUG][useChat] Starting message send:', { 
      content, 
      type, 
      currentChatId,
      isLoading,
      messageCount: messages.length
    });
    
    setIsCreatingChat(!currentChatId);
    
    try {
      await sendMessage(
        content, 
        type, 
        currentChatId, 
        setMessages, 
        setIsLoading, 
        setMessageError
      );
    } catch (error) {
      handleChatCreationError();
    } finally {
      setIsCreatingChat(false);
    }
    
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

  return {
    messages,
    isLoading,
    isCreatingChat,
    messageError,
    currentChatId,
    hasMore,
    handleSendMessage,
    loadInitialMessages,
    loadMoreMessages,
    clearMessages,
  };
};