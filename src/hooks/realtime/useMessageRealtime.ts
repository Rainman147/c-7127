import { useEffect, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useMessageSubscription } from './useMessageSubscription';
import { useConnectionState } from '@/hooks/realtime/useConnectionState';
import { useMessageQueue } from '@/hooks/realtime/useMessageQueue';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const { connectionState, handleConnectionSuccess, handleConnectionError } = useConnectionState();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
  
  const handleMessageUpdate = useCallback((content: string) => {
    logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'Received message update', {
      messageId,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

    addToQueue(messageId!, content);
    processQueue(editedContent, setEditedContent);
  }, [messageId, editedContent, setEditedContent, addToQueue, processQueue]);

  const {
    setupSubscription,
    cleanup: cleanupSubscription,
    retryCount
  } = useMessageSubscription(messageId, handleMessageUpdate);

  useEffect(() => {
    if (!messageId) {
      logger.debug(LogCategory.WEBSOCKET, 'MessageRealtime', 'No message ID provided');
      return;
    }

    logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Setting up realtime subscription', {
      messageId,
      connectionState: connectionState.status,
      retryCount,
      timestamp: new Date().toISOString()
    });

    // Clean up any existing subscription before setting up a new one
    cleanupSubscription();

    setupSubscription().catch(error => {
      logger.error(LogCategory.WEBSOCKET, 'MessageRealtime', 'Failed to setup subscription', {
        messageId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      handleConnectionError(error);
    });

    return () => {
      logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up realtime subscription', {
        messageId,
        timestamp: new Date().toISOString()
      });
      cleanupSubscription();
      clearQueue();
    };
  }, [messageId, setupSubscription, cleanupSubscription, clearQueue, handleConnectionError, connectionState.status, retryCount]);

  return {
    connectionState,
    retryCount,
    lastUpdateTime: Date.now()
  };
};