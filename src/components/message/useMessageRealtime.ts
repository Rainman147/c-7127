import { useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import type { DatabaseMessage } from '@/types/database/messages';
import type { ErrorMetadata } from '@/types/errorTracking';
import { useMessageQueue } from '@/hooks/realtime/useMessageQueue';
import { useRealTime } from '@/contexts/RealTimeContext';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const { connectionState, subscribeToMessage, unsubscribeFromMessage } = useRealTime();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
  const lastUpdateTimeRef = useRef<number>(Date.now());

  const processMessage = (payload: any) => {
    try {
      const newData = payload.new as DatabaseMessage;
      
      addToQueue(newData.id, newData.content);
      processQueue(editedContent, setEditedContent);
      lastUpdateTimeRef.current = Date.now();

      logger.debug(LogCategory.STATE, 'MessageRealtime', 'Processed message update', {
        messageId: newData.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const metadata: ErrorMetadata = {
        component: 'useMessageRealtime',
        severity: 'medium',
        errorType: 'realtime',
        operation: 'process-message',
        timestamp: new Date().toISOString(),
        additionalInfo: {
          messageId,
          connectionState: connectionState.status,
          error: error instanceof Error ? error.message : String(error)
        }
      };
      
      ErrorTracker.trackError(error as Error, metadata);
    }
  };

  useEffect(() => {
    if (!messageId) {
      logger.debug(LogCategory.COMMUNICATION, 'MessageRealtime', 'No message ID provided');
      return;
    }

    subscribeToMessage(messageId, processMessage);

    return () => {
      if (messageId) {
        unsubscribeFromMessage(messageId);
        clearQueue();
      }
    };
  }, [messageId, subscribeToMessage, unsubscribeFromMessage, clearQueue]);

  return {
    connectionState,
    lastUpdateTime: lastUpdateTimeRef.current
  };
};