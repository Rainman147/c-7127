import { useState } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageHandlers = (
  setLastMessage: (message: Message | undefined) => void,
  getBackoffDelay: () => number
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChatMessage = async (message: Message) => {
    try {
      setIsProcessing(true);
      setLastMessage(message);
      
      logger.info(LogCategory.COMMUNICATION, 'MessageHandlers', 'Chat message processed', {
        messageId: message.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageHandlers', 'Error handling chat message:', {
        error,
        messageId: message.id,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMessageUpdate = async (content: string) => {
    try {
      logger.debug(LogCategory.COMMUNICATION, 'MessageHandlers', 'Message update received', {
        contentLength: content.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageHandlers', 'Error handling message update:', {
        error,
        timestamp: new Date().toISOString()
      });
    }
  };

  return {
    handleChatMessage,
    handleMessageUpdate,
    isProcessing
  };
};