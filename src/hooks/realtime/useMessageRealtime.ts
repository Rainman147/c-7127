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
    addToQueue(messageId!, content);
    processQueue(editedContent, setEditedContent);
  }, [messageId, editedContent, setEditedContent, addToQueue, processQueue]);

  const {
    setupSubscription,
    cleanup,
    retryCount
  } = useMessageSubscription(messageId, handleMessageUpdate);

  useEffect(() => {
    logger.info(LogCategory.LIFECYCLE, 'MessageRealtime', 'Initializing realtime connection:', {
      messageId,
      connectionState: connectionState.status,
      timestamp: new Date().toISOString()
    });

    setupSubscription().catch(handleConnectionError);

    return () => {
      logger.info(LogCategory.LIFECYCLE, 'MessageRealtime', 'Cleaning up realtime connection:', {
        messageId,
        timestamp: new Date().toISOString()
      });
      cleanup();
      clearQueue();
    };
  }, [messageId, setupSubscription, cleanup, clearQueue, handleConnectionError]);

  return {
    connectionState,
    retryCount,
    lastUpdateTime: Date.now()
  };
};