import { useCallback, useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useSubscriptionManager } from './useSubscriptionManager';
import { useConnectionState } from './useConnectionState';
import { useMessageQueue } from './useMessageQueue';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const { connectionState, handleConnectionSuccess, handleConnectionError } = useConnectionState();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
  const { subscribe, cleanupSubscription } = useSubscriptionManager();
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
    if (!messageId || messageId === currentMessageId.current) {
      return;
    }

    // Update the current message ID
    currentMessageId.current = messageId;
    const channelName = `message-${messageId}`;

    logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Setting up message subscription', {
      messageId,
      channelName,
      timestamp: new Date().toISOString()
    });

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
          if (status === 'SUBSCRIBED') {
            handleConnectionSuccess();
          }
        }
      });
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'MessageRealtime', 'Failed to setup subscription', {
        messageId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      handleConnectionError(error as Error);
    }

    return () => {
      if (currentMessageId.current) {
        logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up subscription', {
          messageId: currentMessageId.current,
          timestamp: new Date().toISOString()
        });
        cleanupSubscription(`message-${currentMessageId.current}`);
        currentMessageId.current = undefined;
        clearQueue();
      }
    };
  }, [messageId, subscribe, cleanupSubscription, handleMessageUpdate, handleConnectionSuccess, handleConnectionError, clearQueue]);

  return {
    connectionState,
    retryCount: connectionState.retryCount
  };
};