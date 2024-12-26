import { useCallback, useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useRealTime } from '@/contexts/RealTimeContext';
import { useMessageQueue } from './useMessageQueue';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void,
  componentId: string
) => {
  const { connectionState, subscribeToMessage, unsubscribeFromMessage } = useRealTime();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
  const lastUpdateTimeRef = useRef<number>(Date.now());

  const handleMessageUpdate = useCallback((content: string) => {
    logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'Received message update', {
      messageId,
      contentLength: content.length,
      componentId,
      timestamp: new Date().toISOString()
    });

    addToQueue(messageId!, content);
    processQueue(editedContent, setEditedContent);
    lastUpdateTimeRef.current = Date.now();
  }, [messageId, editedContent, setEditedContent, addToQueue, processQueue, componentId]);

  useEffect(() => {
    if (!messageId) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'No message ID provided');
      return;
    }

    subscribeToMessage(messageId, componentId, handleMessageUpdate);

    return () => {
      if (messageId) {
        logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up subscription', {
          messageId,
          componentId,
          timestamp: new Date().toISOString()
        });
        unsubscribeFromMessage(messageId, componentId);
        clearQueue();
      }
    };
  }, [messageId, componentId, subscribeToMessage, unsubscribeFromMessage, handleMessageUpdate, clearQueue]);

  return {
    connectionState,
    lastUpdateTime: lastUpdateTimeRef.current,
    retryCount: connectionState.retryCount
  };
};