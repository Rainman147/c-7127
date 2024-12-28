import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionConfig } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useChatSubscription = (
  subscribe: (config: SubscriptionConfig) => RealtimeChannel,
  cleanup: (channelKey?: string) => void,
  onError: (error: Error) => void
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
      event: 'INSERT',
      onMessage: (payload) => {
        logger.debug(LogCategory.WEBSOCKET, 'ChatSubscription', 'Received message:', {
          chatId,
          componentId,
          payload,
          timestamp: new Date().toISOString()
        });
      },
      onError: (error) => {
        logger.error(LogCategory.WEBSOCKET, 'ChatSubscription', 'Subscription error:', {
          error,
          chatId,
          componentId,
          timestamp: new Date().toISOString()
        });
        onError(error);
      }
    };

    subscribe(config);
  }, [subscribe, onError]);

  const unsubscribeFromChat = useCallback((chatId: string, componentId: string) => {
    logger.info(LogCategory.WEBSOCKET, 'ChatSubscription', 'Unsubscribing from chat:', {
      chatId,
      componentId,
      timestamp: new Date().toISOString()
    });
    cleanup(`messages:${chatId}`);
  }, [cleanup]);

  return {
    subscribeToChat,
    unsubscribeFromChat
  };
};