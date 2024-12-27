import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { CustomError } from '@/contexts/realtime/types/errors';

export const useMessageSubscription = (
  subscribeToChannel: (config: any) => void,
  unsubscribeFromChannel: (channelKey: string) => void,
  handleError: (error: CustomError) => void,
  handleMessageUpdate: (messageId: string, onUpdate: (content: string) => void) => (payload: any) => void
) => {
  const subscribeToMessage = useCallback((messageId: string, componentId: string, onUpdate: (content: string) => void) => {
    const subscriptionKey = `messages-id=eq.${messageId}`;
    const config = {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `id=eq.${messageId}`,
      onMessage: handleMessageUpdate(messageId, onUpdate),
      onError: handleError,
      onSubscriptionStatus: (status: string) => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Message subscription status changed', {
          messageId,
          status,
          timestamp: new Date().toISOString()
        });
      }
    };

    subscribeToChannel(config);
    
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Message subscription queued', {
      messageId,
      componentId,
      timestamp: new Date().toISOString()
    });
  }, [subscribeToChannel, handleError, handleMessageUpdate]);

  const unsubscribeFromMessage = useCallback((messageId: string, componentId: string) => {
    const subscriptionKey = `messages-id=eq.${messageId}`;
    unsubscribeFromChannel(subscriptionKey);
  }, [unsubscribeFromChannel]);

  return {
    subscribeToMessage,
    unsubscribeFromMessage
  };
};