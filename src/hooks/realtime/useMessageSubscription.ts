import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useRetryManager } from './useRetryManager';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';

export const useMessageSubscription = (
  messageId: string | undefined,
  onMessageUpdate: (content: string) => void
) => {
  const channelRef = useRef<RealtimeChannel>();
  const { handleRetry, resetRetryCount, retryCount } = useRetryManager();

  const setupSubscription = useCallback(async () => {
    if (!messageId) {
      logger.debug(LogCategory.COMMUNICATION, 'MessageSubscription', 'No message ID provided');
      return;
    }

    try {
      const channelName = `message-${messageId}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `id=eq.${messageId}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            logger.debug(LogCategory.COMMUNICATION, 'MessageSubscription', 'Received message update:', {
              messageId: newMessage.id,
              timestamp: new Date().toISOString()
            });
            onMessageUpdate(newMessage.content);
          }
        )
        .subscribe((status) => {
          logger.info(LogCategory.COMMUNICATION, 'MessageSubscription', 'Subscription status:', {
            status,
            messageId,
            timestamp: new Date().toISOString()
          });

          if (status === 'SUBSCRIBED') {
            resetRetryCount();
          }
        });

      channelRef.current = channel;
      
    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageSubscription', 'Subscription error:', {
        error,
        messageId,
        retryCount
      });
      await handleRetry(() => setupSubscription(), 'message-subscription');
    }
  }, [messageId, onMessageUpdate, handleRetry, resetRetryCount, retryCount]);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      logger.info(LogCategory.COMMUNICATION, 'MessageSubscription', 'Cleaning up subscription:', {
        messageId,
        timestamp: new Date().toISOString()
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = undefined;
    }
  }, [messageId]);

  return {
    setupSubscription,
    cleanup,
    retryCount
  };
};