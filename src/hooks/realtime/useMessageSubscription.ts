import { useCallback, useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useSubscriptionManager } from './useSubscriptionManager';
import { useRetryManager } from './useRetryManager';

export const useMessageSubscription = (
  messageId: string | undefined,
  onMessageUpdate: (content: string) => void
) => {
  const { subscribe, cleanupSubscription } = useSubscriptionManager();
  const { handleRetry, resetRetryCount, retryCount } = useRetryManager();
  const currentMessageId = useRef<string>();

  const setupSubscription = useCallback(async () => {
    if (!messageId || messageId === currentMessageId.current) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageSubscription', 'Skipping subscription setup', {
        messageId,
        currentMessageId: currentMessageId.current
      });
      return;
    }

    currentMessageId.current = messageId;
    const channelName = `message-${messageId}`;

    try {
      subscribe({
        channelName,
        filter: {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `id=eq.${messageId}`
        },
        onMessage: (payload) => {
          const newMessage = payload.new;
          logger.debug(LogCategory.WEBSOCKET, 'MessageSubscription', 'Message update received', {
            messageId,
            timestamp: new Date().toISOString()
          });
          onMessageUpdate(newMessage.content);
        },
        onSubscriptionChange: (status) => {
          if (status === 'SUBSCRIBED') {
            resetRetryCount();
            logger.info(LogCategory.WEBSOCKET, 'MessageSubscription', 'Subscription active', {
              messageId,
              timestamp: new Date().toISOString()
            });
          }
        },
        onError: (error) => {
          logger.error(LogCategory.WEBSOCKET, 'MessageSubscription', 'Subscription error', {
            error,
            messageId,
            retryCount,
            timestamp: new Date().toISOString()
          });
          handleRetry(() => setupSubscription(), 'message-subscription');
        }
      });
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'MessageSubscription', 'Failed to setup subscription', {
        messageId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      await handleRetry(() => setupSubscription(), 'message-subscription');
    }
  }, [messageId, subscribe, onMessageUpdate, handleRetry, resetRetryCount, retryCount]);

  useEffect(() => {
    setupSubscription();
    return () => {
      if (currentMessageId.current) {
        logger.info(LogCategory.WEBSOCKET, 'MessageSubscription', 'Cleaning up subscription', {
          messageId: currentMessageId.current,
          timestamp: new Date().toISOString()
        });
        cleanupSubscription(`message-${currentMessageId.current}`);
        currentMessageId.current = undefined;
      }
    };
  }, [messageId, setupSubscription, cleanupSubscription]);

  return {
    retryCount
  };
};