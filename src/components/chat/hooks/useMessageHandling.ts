import { useState } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

interface UseMessageHandlingProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<Message>;
  message: string;
  setMessage: (message: string) => void;
  connectionState?: any;
}

export const useMessageHandling = ({
  onSend,
  message,
  setMessage,
  connectionState
}: UseMessageHandlingProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage);
  };

  const handleSubmit = async () => {
    if (!message.trim() || isProcessing) return;

    try {
      setIsProcessing(true);
      logger.debug(LogCategory.USER_ACTION, 'MessageHandling', 'Submitting message', {
        messageLength: message.length,
        timestamp: new Date().toISOString()
      });

      await onSend(message.trim(), 'text');
      setMessage('');
    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageHandling', 'Error submitting message:', {
        error,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleMessageChange,
    handleSubmit,
    isProcessing
  };
};