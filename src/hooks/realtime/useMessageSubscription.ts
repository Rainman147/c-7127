import { useCallback, useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useSubscriptionManager } from './useSubscriptionManager';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useMessageSubscription = (
  messageId: string | undefined,
  onMessageUpdate: (content: string) => void
) => {
  const { subscribe, cleanupSubscription, state } = useSubscriptionManager();
  const currentMessageId = useRef<string>();
  const channelRef = useRef<RealtimeChannel>();

  const setupSubscription = useCallback(async () => {
    if (!messageId || messageId === currentMessageId.current) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageSubscription', 'Skipping subscription setup', {
        messageId,
        currentMessageId: currentMessageId.current
      });
      return;
    }

    // Cleanup previous subscription if exists
    if (channelRef.current) {
      cleanupSubscription(channelRef.current);
      channelRef.current = undefined;
    }

    currentMessageId.current = messageId;

    try {
      const channel = subscribe({
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `id=eq.${messageId}`,
        onMessage: (payload) => {
          const newMessage = payload.new;
          logger.debug(LogCategory.WEBSOCKET, 'MessageSubscription', 'Message update received', {
            messageId,
            timestamp: new Date().toISOString()
          });
          onMessageUpdate(newMessage.content);
        },
        onError: (error) => {
          logger.error(LogCategory.WEBSOCKET, 'MessageSubscription', 'Subscription error', {
            error,
            messageId,
            timestamp: new Date().toISOString()
          });
        },
        onSubscriptionChange: (status) => {
          logger.info(LogCategory.WEBSOCKET, 'MessageSubscription', 'Subscription status changed', {
            messageId,
            status,
            timestamp: new Date().toISOString()
          });
        }
      });

      channelRef.current = channel;
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'MessageSubscription', 'Failed to setup subscription', {
        messageId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }, [messageId, subscribe, cleanupSubscription, onMessageUpdate]);

  useEffect(() => {
    setupSubscription();
    return () => {
      if (channelRef.current) {
        logger.info(LogCategory.WEBSOCKET, 'MessageSubscription', 'Cleaning up subscription', {
          messageId: currentMessageId.current,
          timestamp: new Date().toISOString()
        });
        cleanupSubscription(channelRef.current);
        channelRef.current = undefined;
        currentMessageId.current = undefined;
      }
    };
  }, [messageId, setupSubscription, cleanupSubscription]);

  return {
    retryCount: state.retryCount
  };
};