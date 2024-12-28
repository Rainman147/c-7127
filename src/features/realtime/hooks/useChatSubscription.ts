import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import type { CustomError } from '@/contexts/realtime/types/errors';
import type { SubscriptionConfig } from '@/contexts/realtime/types';

export const useChatSubscription = (
  subscribeToChannel: (config: SubscriptionConfig) => void,
  unsubscribeFromChannel: (channelKey: string) => void,
  handleError: (error: CustomError) => void
) => {
  const subscribeToChat = useCallback((chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    const config: SubscriptionConfig = {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
      onMessage: (payload: any) => {
        logger.debug(LogCategory.WEBSOCKET, 'ChatSubscription', 'Received message', {
          chatId,
          payload,
          timestamp: new Date().toISOString()
        });
      },
      onError: handleError,
      onSubscriptionStatus: (status: string) => {
        logger.info(LogCategory.WEBSOCKET, 'ChatSubscription', 'Chat subscription status changed', {
          chatId,
          status,
          timestamp: new Date().toISOString()
        });
      }
    };

    subscribeToChannel(config);
    
    logger.info(LogCategory.WEBSOCKET, 'ChatSubscription', 'Chat subscription queued', {
      chatId,
      componentId,
      timestamp: new Date().toISOString()
    });
  }, [subscribeToChannel, handleError]);

  const unsubscribeFromChat = useCallback((chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    unsubscribeFromChannel(subscriptionKey);
  }, [unsubscribeFromChannel]);

  return {
    subscribeToChat,
    unsubscribeFromChat
  };
};