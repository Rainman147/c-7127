import { useRef, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

interface QueuedMessage {
  content: string;
  timestamp: number;
}

export const useMessageQueue = () => {
  const messageQueueRef = useRef<Record<string, QueuedMessage>>({});

  const addToQueue = useCallback((messageId: string, content: string) => {
    logger.debug(LogCategory.STATE, 'MessageQueue', 'Adding message to queue', {
      messageId,
      timestamp: Date.now()
    });

    messageQueueRef.current[messageId] = {
      content,
      timestamp: Date.now()
    };
  }, []);

  const processQueue = useCallback((currentContent: string, setContent: (content: string) => void) => {
    const messages = Object.entries(messageQueueRef.current)
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    for (const [msgId, msg] of messages) {
      if (msg.content !== currentContent) {
        logger.debug(LogCategory.STATE, 'MessageQueue', 'Processing queued message', {
          messageId: msgId,
          timestamp: msg.timestamp
        });

        setContent(msg.content);
      }
      delete messageQueueRef.current[msgId];
    }
  }, []);

  const clearQueue = useCallback(() => {
    logger.debug(LogCategory.STATE, 'MessageQueue', 'Clearing message queue');
    messageQueueRef.current = {};
  }, []);

  return {
    addToQueue,
    processQueue,
    clearQueue
  };
};