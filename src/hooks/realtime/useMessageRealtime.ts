import { useCallback, useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useSubscriptionManager } from './useSubscriptionManager';
import { useConnectionState } from './useConnectionState';
import { useMessageQueue } from './useMessageQueue';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const { connectionState, handleConnectionSuccess, handleConnectionError } = useConnectionState();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
  const { subscribe, cleanupSubscription } = useSubscriptionManager();
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

  // Cleanup function to handle channel removal
  const cleanupChannel = useCallback(() => {
    if (currentChannel.current && currentMessageId.current) {
      logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up subscription', {
        messageId: currentMessageId.current,
        channelName: `message-${currentMessageId.current}`,
        timestamp: new Date().toISOString()
      });
      
      cleanupSubscription(`message-${currentMessageId.current}`);
      currentChannel.current = undefined;
      currentMessageId.current = undefined;
      clearQueue();
    }
  }, [cleanupSubscription, clearQueue]);

  useEffect(() => {
    // If messageId changes or is undefined, cleanup previous subscription
    if (!messageId) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'No message ID provided, cleaning up', {
        previousMessageId: currentMessageId.current,
        timestamp: new Date().toISOString()
      });
      cleanupChannel();
      return;
    }

    // Skip if already subscribed to this message
    if (messageId === currentMessageId.current) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'Already subscribed to message', {
        messageId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Cleanup previous subscription before creating a new one
    cleanupChannel();

    // Update the current message ID and create new subscription
    currentMessageId.current = messageId;
    const channelName = `message-${messageId}`;

    logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Setting up message subscription', {
      messageId,
      channelName,
      timestamp: new Date().toISOString()
    });

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
          handleMessageUpdate(newMessage.content);
        },
        onError: (error) => {
          logger.error(LogCategory.WEBSOCKET, 'MessageRealtime', 'Subscription error', {
            messageId,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          handleConnectionError(error);
        },
        onSubscriptionChange: (status) => {
          logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Subscription status changed', {
            messageId,
            status,
            timestamp: new Date().toISOString()
          });
          
          if (status === 'SUBSCRIBED') {
            handleConnectionSuccess();
          }
        }
      });

      currentChannel.current = channel;
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'MessageRealtime', 'Failed to setup subscription', {
        messageId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      handleConnectionError(error as Error);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up subscription on unmount/deps change', {
        messageId: currentMessageId.current,
        timestamp: new Date().toISOString()
      });
      cleanupChannel();
    };
  }, [messageId, subscribe, cleanupChannel, handleMessageUpdate, handleConnectionSuccess, handleConnectionError]);

  return {
    connectionState,
    retryCount: connectionState.retryCount
  };
};