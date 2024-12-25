import { useCallback, useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { supabase } from '@/integrations/supabase/client';
import { subscriptionManager } from '@/utils/realtime/SubscriptionManager';
import { useMessageQueue } from './useMessageQueue';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { DatabaseMessage } from '@/types/database/messages';
import { useConnectionState } from '@/hooks/realtime/useConnectionState';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const { connectionState } = useConnectionState();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
  const currentMessageId = useRef<string>();

  const handleMessageUpdate = useCallback((content: string) => {
    logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'Received message update', {
      messageId,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

    addToQueue(messageId!, content);
    processQueue(editedContent, setEditedContent);
  }, [messageId, editedContent, setEditedContent, addToQueue, processQueue]);

  useEffect(() => {
    if (!messageId) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'No message ID provided');
      return;
    }

    if (messageId === currentMessageId.current) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'Already subscribed to message', {
        messageId
      });
      return;
    }

    // Cleanup previous subscription if exists
    if (currentMessageId.current) {
      subscriptionManager.removeChannel(currentMessageId.current);
    }

    currentMessageId.current = messageId;

    try {
      // Check if channel already exists
      let channel = subscriptionManager.getChannel(messageId);

      if (!channel) {
        // Create new channel if none exists
        channel = supabase.channel(`message-${messageId}`);
        
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `id=eq.${messageId}`
          },
          (payload) => {
            const newMessage = payload.new as DatabaseMessage;
            handleMessageUpdate(newMessage.content);
          }
        ).subscribe(status => {
          logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Subscription status changed', {
            messageId,
            status,
            timestamp: new Date().toISOString()
          });
        });

        subscriptionManager.addChannel(messageId, channel);
      }
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'MessageRealtime', 'Failed to setup subscription', {
        messageId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }

    return () => {
      if (currentMessageId.current) {
        logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up subscription', {
          messageId: currentMessageId.current,
          timestamp: new Date().toISOString()
        });
        subscriptionManager.removeChannel(currentMessageId.current);
        currentMessageId.current = undefined;
        clearQueue();
      }
    };
  }, [messageId, handleMessageUpdate, clearQueue]);

  return {
    connectionState,
    retryCount: connectionState.retryCount
  };
};