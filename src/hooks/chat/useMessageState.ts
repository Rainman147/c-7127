import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Message } from '@/types/chat';

interface MessageError {
  code: string;
  message: string;
}

export const useMessageState = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [messageError, setMessageError] = useState<MessageError | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const updateChatId = useCallback((chatId: string) => {
    console.log('[useMessageState] Updating chat ID:', chatId);
    setCurrentChatId(chatId);
    
    // Update URL safely
    navigate(`/c/${chatId}`, { replace: true });
  }, [navigate]);

  const handleChatCreationError = useCallback(() => {
    console.log('[useMessageState] Handling chat creation error');
    setCurrentChatId(null);
    setIsCreatingChat(false);
    navigate('/', { replace: true });
  }, [navigate]);

  return {
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
  };
};