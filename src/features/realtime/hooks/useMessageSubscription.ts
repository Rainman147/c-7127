import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionConfig } from '../types';
import type { ConnectionError } from '../types/errors';

export const useMessageSubscription = (
  subscribe: (config: SubscriptionConfig) => void,
  cleanup: (channelKey?: string) => void,
  onError: (error: ConnectionError) => void,
  onMessageUpdate: (content: string) => void
) => {
  const subscribeToMessage = useCallback((
    messageId: string,
    componentId: string,
    onUpdate: (content: string) => void
  ) => {
    logger.info(LogCategory.WEBSOCKET, 'MessageSubscription', 'Subscribing to message:', {
      messageId,
      componentId,
      timestamp: new Date().toISOString()
    });

    const config: SubscriptionConfig = {
      table: 'edited_messages',
      schema: 'public',
      filter: `message_id=eq.${messageId}`,
      event: '*',
      onMessage: (payload) => {
        if (payload.new?.edited_content) {
          onUpdate(payload.new.edited_content);
        }
      }
    };

    subscribe(config);
  }, [subscribe]);

  const unsubscribeFromMessage = useCallback((messageId: string, componentId: string) => {
    logger.info(LogCategory.WEBSOCKET, 'MessageSubscription', 'Unsubscribing from message:', {
      messageId,
      componentId,
      timestamp: new Date().toISOString()
    });
    cleanup(`edited_messages-message_id=eq.${messageId}`);
  }, [cleanup]);

  return {
    subscribeToMessage,
    unsubscribeFromMessage
  };
};