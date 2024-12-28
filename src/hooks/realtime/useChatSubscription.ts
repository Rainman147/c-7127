import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import type { CustomError } from '@/contexts/realtime/types/errors';
import type { SubscriptionConfig } from '@/contexts/realtime/types';

export const useChatSubscription = (
  subscribeToChannel: (config: SubscriptionConfig) => void,
  unsubscribeFromChannel: (channelKey: string) => void,
  handleError: (error: CustomError) => void,
  onSubscriptionError: (error: Error) => void
) => {
  const subscribeToChat = useCallback((chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    
    logger.info(LogCategory.SUBSCRIPTION, 'ChatSubscription', 'Initializing chat subscription', {
      chatId,
      componentId,
      subscriptionKey,
      timestamp: new Date().toISOString()
    });

    const config: SubscriptionConfig = {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
      onMessage: (payload: any) => {
        logger.debug(LogCategory.SUBSCRIPTION, 'ChatSubscription', 'Received message', {
          chatId,
          messageId: payload.new?.id,
          type: payload.type,
          timestamp: new Date().toISOString()
        });
      },
      onError: (error: CustomError) => {
        logger.error(LogCategory.SUBSCRIPTION, 'ChatSubscription', 'Subscription error', {
          chatId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        handleError(error);
        onSubscriptionError(new Error(error.message));
      },
      onSubscriptionStatus: (status: string) => {
        logger.info(LogCategory.SUBSCRIPTION, 'ChatSubscription', 'Chat subscription status changed', {
          chatId,
          status,
          timestamp: new Date().toISOString()
        });
      }
    };

    subscribeToChannel(config);
  }, [subscribeToChannel, handleError, onSubscriptionError]);

  const unsubscribeFromChat = useCallback((chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    
    logger.info(LogCategory.SUBSCRIPTION, 'ChatSubscription', 'Unsubscribing from chat', {
      chatId,
      componentId,
      timestamp: new Date().toISOString()
    });
    
    unsubscribeFromChannel(subscriptionKey);
  }, [unsubscribeFromChannel]);

  return {
    subscribeToChat,
    unsubscribeFromChat
  };
};