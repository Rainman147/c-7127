import { useCallback, useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useSubscriptionManager } from './useSubscriptionManager';
import { useMessageQueue } from './useMessageQueue';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { DatabaseMessage } from '@/types/database/messages';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const { state: connectionState, subscribe, cleanupSubscription } = useSubscriptionManager();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
  const currentMessageId = useRef<string>();
  const currentChannel = useRef<RealtimeChannel>();
  
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
      logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'No message ID provided, cleaning up', {
        previousMessageId: currentMessageId.current,
        timestamp: new Date().toISOString()
      });
      
      if (currentChannel.current) {
        cleanupSubscription(currentChannel.current);
        currentChannel.current = undefined;
      }
      return;
    }

    if (messageId === currentMessageId.current) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'Already subscribed to message', {
        messageId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Cleanup previous subscription
    if (currentChannel.current) {
      cleanupSubscription(currentChannel.current);
      currentChannel.current = undefined;
    }

    currentMessageId.current = messageId;

    try {
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
            messageId,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        },
        onSubscriptionChange: (status) => {
          logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Subscription status changed', {
            messageId,
            status,
            timestamp: new Date().toISOString()
          });
        }
      });

      currentChannel.current = channel;
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'MessageRealtime', 'Failed to setup subscription', {
        messageId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }

    return () => {
      if (currentChannel.current) {
        logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up subscription', {
          messageId: currentMessageId.current,
          timestamp: new Date().toISOString()
        });
        cleanupSubscription(currentChannel.current);
        currentChannel.current = undefined;
        currentMessageId.current = undefined;
        clearQueue();
      }
    };
  }, [messageId, subscribe, cleanupSubscription, handleMessageUpdate, clearQueue]);

  return {
    connectionState,
    retryCount: connectionState.retryCount
  };
};