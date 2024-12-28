import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageHandlers = (
  setLastMessage: (message: Message) => void,
  getBackoffDelay: () => number
) => {
  const handleChatMessage = useCallback((payload: any) => {
    try {
      logger.debug(LogCategory.WEBSOCKET, 'MessageHandlers', 'Received chat message:', {
        payload,
        timestamp: new Date().toISOString()
      });

      if (payload.new) {
        setLastMessage(payload.new as Message);
      }
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'MessageHandlers', 'Error handling chat message:', {
        error,
        payload,
        timestamp: new Date().toISOString()
      });
    }
  }, [setLastMessage]);

  const handleMessageUpdate = useCallback((payload: any) => {
    try {
      logger.debug(LogCategory.WEBSOCKET, 'MessageHandlers', 'Received message update:', {
        payload,
        timestamp: new Date().toISOString()
      });

      if (payload.new?.content) {
        setLastMessage(payload.new as Message);
      }
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'MessageHandlers', 'Error handling message update:', {
        error,
        payload,
        timestamp: new Date().toISOString()
      });
    }
  }, [setLastMessage]);

  return {
    handleChatMessage,
    handleMessageUpdate
  };
};