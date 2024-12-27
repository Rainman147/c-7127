import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageHandlers = (
  setLastMessage: (message: Message) => void,
  getNextDelay: () => number
) => {
  const handleChatMessage = useCallback((payload: any) => {
    logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Received chat message:', payload);
    
    if (payload.new) {
      setLastMessage(payload.new as Message);
    }
  }, [setLastMessage]);

  const handleMessageUpdate = useCallback((messageId: string, onUpdate: (content: string) => void) => {
    return (payload: any) => {
      logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Message update received:', {
        messageId,
        payload,
        timestamp: new Date().toISOString()
      });
      
      if (payload.new?.content) {
        onUpdate(payload.new.content);
      }
    };
  }, []);

  return {
    handleChatMessage,
    handleMessageUpdate
  };
};