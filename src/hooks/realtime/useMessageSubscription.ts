import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useSubscriptionManager } from './useSubscriptionManager';
import { useRetryManager } from './useRetryManager';

export const useMessageSubscription = (
  messageId: string | undefined,
  onMessageUpdate: (content: string) => void
) => {
  const { subscribe, cleanup } = useSubscriptionManager();
  const { handleRetry, resetRetryCount, retryCount } = useRetryManager();

  const setupSubscription = useCallback(async () => {
    if (!messageId) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageSubscription', 'No message ID provided');
      return;
    }

    const channelName = `message-${messageId}`;

    try {
      const channel = subscribe({
        channelName,
        filter: {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `id=eq.${messageId}`
        },
        onMessage: (payload) => {
          const newMessage = payload.new;
          onMessageUpdate(newMessage.content);
        },
        onSubscriptionChange: (status) => {
          if (status === 'SUBSCRIBED') {
            resetRetryCount();
          }
        }
      });

      if (!channel) {
        throw new Error('Failed to create channel');
      }
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'MessageSubscription', 'Subscription error', {
        error,
        messageId,
        retryCount,
        timestamp: new Date().toISOString()
      });
      await handleRetry(() => setupSubscription(), 'message-subscription');
    }
  }, [messageId, subscribe, onMessageUpdate, handleRetry, resetRetryCount, retryCount]);

  return {
    setupSubscription,
    cleanup,
    retryCount
  };
};