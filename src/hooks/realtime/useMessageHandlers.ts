import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageHandlers = (
  setLastMessage: (message: Message) => void,
  getNextDelay: () => number
) => {
  const handleChatMessage = useCallback((payload: any) => {
    if (payload.new && payload.eventType === 'INSERT') {
      setLastMessage(payload.new as Message);
      
      logger.info(LogCategory.WEBSOCKET, 'MessageHandlers', 'New chat message received', {
        messageId: payload.new.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [setLastMessage]);

  const handleMessageUpdate = useCallback((messageId: string, onUpdate: (content: string) => void) => {
    return (payload: any) => {
      if (payload.new?.content) {
        onUpdate(payload.new.content);
        
        logger.info(LogCategory.WEBSOCKET, 'MessageHandlers', 'Message update received', {
          messageId,
          timestamp: new Date().toISOString()
        });
      }
    };
  }, []);

  return {
    handleChatMessage,
    handleMessageUpdate
  };
};