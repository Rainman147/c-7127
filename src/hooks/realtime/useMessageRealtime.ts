import { useCallback, useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { supabase } from '@/integrations/supabase/client';
import { useMessageQueue } from './useMessageQueue';
import { useSubscriptionManager } from './useSubscriptionManager';
import type { DatabaseMessage } from '@/types/database/messages';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const { state: connectionState, subscribe, cleanupSubscription } = useSubscriptionManager();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();
  const lastUpdateTimeRef = useRef<number>(Date.now());

  const handleMessageUpdate = useCallback((content: string) => {
    logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'Received message update', {
      messageId,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

    addToQueue(messageId!, content);
    processQueue(editedContent, setEditedContent);
    lastUpdateTimeRef.current = Date.now();
  }, [messageId, editedContent, setEditedContent, addToQueue, processQueue]);

  useEffect(() => {
    if (!messageId) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'No message ID provided');
      return;
    }

    const channel = subscribe({
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `id=eq.${messageId}`,
      onMessage: (payload) => {
        const newMessage = payload.new as DatabaseMessage;
        handleMessageUpdate(newMessage.content);
      },
      onError: (error) => {
        logger.error(LogCategory.WEBSOCKET, 'MessageRealtime', 'Subscription error', {
          error,
          messageId,
          timestamp: new Date().toISOString()
        });
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up subscription', {
          messageId: messageId,
          timestamp: new Date().toISOString()
        });
        cleanupSubscription(channelRef.current);
        channelRef.current = undefined;
        clearQueue();
      }
    };
  }, [messageId, subscribe, cleanupSubscription, handleMessageUpdate, clearQueue]);

  return {
    connectionState,
    lastUpdateTime: lastUpdateTimeRef.current,
    retryCount: connectionState.retryCount
  };
};