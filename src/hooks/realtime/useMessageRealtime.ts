import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useSubscriptionManager } from './useSubscriptionManager';
import { useConnectionState } from '@/hooks/realtime/useConnectionState';
import { useMessageQueue } from '@/hooks/realtime/useMessageQueue';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const { connectionState, handleConnectionSuccess, handleConnectionError } = useConnectionState();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
  const { subscribe, cleanup } = useSubscriptionManager();
  
  const handleMessageUpdate = useCallback((content: string) => {
    logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'Received message update', {
      messageId,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

    addToQueue(messageId!, content);
    processQueue(editedContent, setEditedContent);
  }, [messageId, editedContent, setEditedContent, addToQueue, processQueue]);

  const setupSubscription = useCallback(() => {
    if (!messageId) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'No message ID provided');
      return () => {};
    }

    const channelName = `message-${messageId}`;

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
      onError: handleConnectionError,
      onSubscriptionChange: (status) => {
        if (status === 'SUBSCRIBED') {
          handleConnectionSuccess();
        }
      }
    });

    return () => {
      logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up subscription', {
        messageId,
        timestamp: new Date().toISOString()
      });
      cleanup(channelName);
      clearQueue();
    };
  }, [messageId, subscribe, cleanup, clearQueue, handleMessageUpdate, handleConnectionSuccess, handleConnectionError]);

  return {
    setupSubscription,
    connectionState,
    retryCount: connectionState.retryCount
  };
};