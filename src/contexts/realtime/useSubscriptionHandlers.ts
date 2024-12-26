import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import type { ExponentialBackoff } from '@/utils/backoff';

export const useMessageHandlers = (
  setLastMessage: (message: Message) => void,
  backoff: ExponentialBackoff
) => {
  const handleChatMessage = useCallback((payload: any) => {
    logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Received chat message:', payload);
    backoff.reset();
    
    if (payload.new) {
      setLastMessage(payload.new as Message);
    }
  }, [setLastMessage, backoff]);

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