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
    
    logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Setting up message subscription', {
      messageId,
      channelName,
      timestamp: new Date().toISOString()
    });

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
        logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'Message update received', {
          messageId,
          timestamp: new Date().toISOString()
        });
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
        logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'Subscription status changed', {
          messageId,
          status,
          timestamp: new Date().toISOString()
        });
        if (status === 'SUBSCRIBED') {
          handleConnectionSuccess();
        }
      }
    });

    return () => {
      logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up subscription', {
        messageId,
        channelName,
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