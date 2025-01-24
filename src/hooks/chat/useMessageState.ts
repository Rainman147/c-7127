import { useState } from 'react';
import type { Message } from '@/types/chat';

interface MessageError {
  code: string;
  message: string;
}

export const useMessageState = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageError, setMessageError] = useState<MessageError | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  return {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    messageError,
    setMessageError,
    currentChatId,
    setCurrentChatId,
  };
};