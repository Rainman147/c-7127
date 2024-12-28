import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionConfig } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useMessageSubscription = (
  subscribe: (config: SubscriptionConfig) => RealtimeChannel,
  cleanup: (channelKey?: string) => void,
  onError: (error: Error) => void,
  onUpdate: (content: string) => void
) => {
  const subscribeToMessage = useCallback((
    messageId: string, 
    componentId: string,
    handleUpdate: (content: string) => void
  ) => {
    logger.info(LogCategory.WEBSOCKET, 'MessageSubscription', 'Subscribing to message:', {
      messageId,
      componentId,
      timestamp: new Date().toISOString()
    });

    const config: SubscriptionConfig = {
      table: 'messages',
      schema: 'public',
      filter: `id=eq.${messageId}`,
      event: 'UPDATE',
      onMessage: (payload) => {
        logger.debug(LogCategory.WEBSOCKET, 'MessageSubscription', 'Message updated:', {
          messageId,
          componentId,
          payload,
          timestamp: new Date().toISOString()
        });
        
        if (payload.new?.content) {
          handleUpdate(payload.new.content);
          onUpdate(payload.new.content);
        }
      },
      onError: (error) => {
        logger.error(LogCategory.WEBSOCKET, 'MessageSubscription', 'Subscription error:', {
          error,
          messageId,
          componentId,
          timestamp: new Date().toISOString()
        });
        onError(error);
      }
    };

    subscribe(config);
  }, [subscribe, onError, onUpdate]);

  const unsubscribeFromMessage = useCallback((messageId: string, componentId: string) => {
    logger.info(LogCategory.WEBSOCKET, 'MessageSubscription', 'Unsubscribing from message:', {
      messageId,
      componentId,
      timestamp: new Date().toISOString()
    });
    cleanup(`messages:${messageId}`);
  }, [cleanup]);

  return {
    subscribeToMessage,
    unsubscribeFromMessage
  };
};