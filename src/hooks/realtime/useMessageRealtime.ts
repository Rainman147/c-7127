import { useCallback, useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useRealTime } from '@/contexts/RealTimeContext';
import { useMessageQueue } from './useMessageQueue';
import type { DatabaseMessage } from '@/types/database/messages';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const { connectionState, subscribeToMessage, unsubscribeFromMessage } = useRealTime();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
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

    subscribeToMessage(messageId, handleMessageUpdate);

    return () => {
      if (messageId) {
        logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up subscription', {
          messageId,
          timestamp: new Date().toISOString()
        });
        unsubscribeFromMessage(messageId);
        clearQueue();
      }
    };
  }, [messageId, subscribeToMessage, unsubscribeFromMessage, handleMessageUpdate, clearQueue]);

  return {
    connectionState,
    lastUpdateTime: lastUpdateTimeRef.current,
    retryCount: connectionState.retryCount
  };
};