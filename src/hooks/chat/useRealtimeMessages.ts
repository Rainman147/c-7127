import { useEffect } from 'react';
import { useRealTime } from '@/contexts/RealTimeContext';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useRealTimeMessages = (
  chatId: string | null,
  onMessageReceived: (message: Message) => void
) => {
  const { subscribeToChat, unsubscribeFromChat, connectionState, lastMessage } = useRealTime();

  useEffect(() => {
    if (!chatId) {
      logger.debug(LogCategory.COMMUNICATION, 'useRealTimeMessages', 'No chat ID provided');
      return;
    }

    logger.info(LogCategory.COMMUNICATION, 'useRealTimeMessages', 'Setting up subscription:', {
      chatId,
      connectionState,
    });

    subscribeToChat(chatId);

    return () => {
      logger.info(LogCategory.COMMUNICATION, 'useRealTimeMessages', 'Cleaning up subscription:', {
        chatId,
      });
      unsubscribeFromChat(chatId);
    };
  }, [chatId, subscribeToChat, unsubscribeFromChat]);

  // Handle new messages
  useEffect(() => {
    if (lastMessage) {
      logger.debug(LogCategory.COMMUNICATION, 'useRealTimeMessages', 'New message received:', {
        messageId: lastMessage.id,
        chatId,
      });
      onMessageReceived(lastMessage);
    }
  }, [lastMessage, onMessageReceived]);

  return {
    connectionState,
  };
};