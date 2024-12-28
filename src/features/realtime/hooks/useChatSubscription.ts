import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionConfig } from '../types';
import type { ConnectionError } from '../types/errors';

export const useChatSubscription = (
  subscribe: (config: SubscriptionConfig) => void,
  cleanup: (channelKey?: string) => void,
  onError: (error: ConnectionError) => void
) => {
  const subscribeToChat = useCallback((chatId: string, componentId: string) => {
    logger.info(LogCategory.WEBSOCKET, 'ChatSubscription', 'Subscribing to chat:', {
      chatId,
      componentId,
      timestamp: new Date().toISOString()
    });

    const config: SubscriptionConfig = {
      table: 'messages',
      schema: 'public',
      filter: `chat_id=eq.${chatId}`,
      event: '*',
      onMessage: (payload) => {
        logger.debug(LogCategory.WEBSOCKET, 'ChatSubscription', 'Message received:', {
          chatId,
          componentId,
          timestamp: new Date().toISOString()
        });
      },
      onSubscriptionStatus: (status) => {
        if (status === 'SUBSCRIBED') {
          logger.info(LogCategory.WEBSOCKET, 'ChatSubscription', 'Successfully subscribed to chat:', {
            chatId,
            componentId,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    subscribe(config);
  }, [subscribe]);

  const unsubscribeFromChat = useCallback((chatId: string, componentId: string) => {
    logger.info(LogCategory.WEBSOCKET, 'ChatSubscription', 'Unsubscribing from chat:', {
      chatId,
      componentId,
      timestamp: new Date().toISOString()
    });
    cleanup(`messages-chat_id=eq.${chatId}`);
  }, [cleanup]);

  return {
    subscribeToChat,
    unsubscribeFromChat
  };
};