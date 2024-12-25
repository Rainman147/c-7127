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
  const subscriptionTimeRef = useRef<number>(Date.now());
  const { handleRetry, resetRetryCount, retryCount } = useRetryManager();

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const duration = Date.now() - subscriptionTimeRef.current;
      
      logger.info(LogCategory.WEBSOCKET, 'MessageSubscription', 'Cleaning up subscription', {
        messageId,
        subscriptionDuration: duration,
        channelName: channelRef.current.topic,
        timestamp: new Date().toISOString()
      });
      
      supabase.removeChannel(channelRef.current);
      channelRef.current = undefined;
      subscriptionTimeRef.current = Date.now();
    }
  }, [messageId]);

  const setupSubscription = useCallback(async () => {
    if (!messageId) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageSubscription', 'No message ID provided');
      return;
    }

    // Clean up existing subscription before creating a new one
    cleanup();

    try {
      const channelName = `message-${messageId}`;
      
      logger.debug(LogCategory.WEBSOCKET, 'MessageSubscription', 'Creating new subscription', {
        messageId,
        channelName,
        timestamp: new Date().toISOString()
      });

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
            const latency = Date.now() - subscriptionTimeRef.current;
            
            logger.debug(LogCategory.WEBSOCKET, 'MessageSubscription', 'Received message update', {
              messageId: newMessage.id,
              eventType: payload.eventType,
              latency,
              timestamp: new Date().toISOString()
            });
            
            onMessageUpdate(newMessage.content);
          }
        )
        .subscribe((status) => {
          logger.info(LogCategory.WEBSOCKET, 'MessageSubscription', 'Subscription status changed', {
            status,
            messageId,
            channelName,
            timestamp: new Date().toISOString()
          });

          if (status === 'SUBSCRIBED') {
            subscriptionTimeRef.current = Date.now();
            resetRetryCount();
          }
        });

      channelRef.current = channel;
      
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'MessageSubscription', 'Subscription error', {
        error,
        messageId,
        retryCount,
        timestamp: new Date().toISOString()
      });
      await handleRetry(() => setupSubscription(), 'message-subscription');
    }
  }, [messageId, onMessageUpdate, handleRetry, resetRetryCount, retryCount, cleanup]);

  return {
    setupSubscription,
    cleanup,
    retryCount
  };
};