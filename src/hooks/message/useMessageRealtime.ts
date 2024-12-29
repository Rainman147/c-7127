import { useEffect, useRef, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useMessageQueue } from '@/hooks/queue/useMessageQueue';
import { useRealTime } from '@/contexts/RealTimeContext';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void,
  componentId: string
) => {
  const { connectionState, subscribeToMessage, unsubscribeFromMessage } = useRealTime();
  const { addMessage, processMessages, clearQueue } = useMessageQueue();
  const lastUpdateTimeRef = useRef<number>(Date.now());

  const processMessage = useCallback((content: string) => {
    try {
      addMessage(messageId!, content);
      processMessages(async (msg) => {
        if (msg.content !== editedContent) {
          setEditedContent(msg.content);
        }
      });
      lastUpdateTimeRef.current = Date.now();

      logger.debug(LogCategory.STATE, 'MessageRealtime', 'Processed message update', {
        messageId,
        componentId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(LogCategory.STATE, 'MessageRealtime', 'Failed to process message', {
        messageId,
        componentId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }, [messageId, editedContent, setEditedContent, addMessage, processMessages, componentId]);

  useEffect(() => {
    if (!messageId) {
      logger.debug(LogCategory.COMMUNICATION, 'MessageRealtime', 'No message ID provided', {
        componentId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    subscribeToMessage(messageId, componentId, processMessage);

    return () => {
      if (messageId) {
        unsubscribeFromMessage(messageId, componentId);
        clearQueue();
      }
    };
  }, [messageId, componentId, subscribeToMessage, unsubscribeFromMessage, clearQueue, processMessage]);

  return {
    connectionState,
    lastUpdateTime: lastUpdateTimeRef.current
  };
};