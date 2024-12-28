import { useCallback, useEffect, useRef } from 'react';
import { queueManager, type QueuedMessage } from '@/utils/queue/QueueManager';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { useConnectionState } from '@/hooks/realtime/useConnectionState';

export const useMessageQueue = () => {
  const { toast } = useToast();
  const { connectionState } = useConnectionState();
  const processingRef = useRef<boolean>(false);

  const addMessage = useCallback(async (content: string, priority: QueuedMessage['priority'] = 'medium') => {
    try {
      await queueManager.addToQueue({
        id: `msg-${Date.now()}`,
        content,
        priority
      });

      logger.debug(LogCategory.STATE, 'MessageQueue', 'Message queued successfully', {
        priority,
        connectionStatus: connectionState.status
      });
    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageQueue', 'Failed to queue message', {
        error,
        connectionStatus: connectionState.status
      });
      
      toast({
        title: "Failed to queue message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [connectionState.status, toast]);

  const processMessages = useCallback(async (processor: (message: QueuedMessage) => Promise<void>) => {
    if (processingRef.current || connectionState.status !== 'connected') {
      return;
    }

    processingRef.current = true;
    try {
      await queueManager.processQueue(processor);
    } finally {
      processingRef.current = false;
    }
  }, [connectionState.status]);

  // Auto-process queue when connection is restored
  useEffect(() => {
    if (connectionState.status === 'connected') {
      const status = queueManager.getQueueStatus();
      if (status.pending > 0 || status.failed > 0) {
        logger.info(LogCategory.STATE, 'MessageQueue', 'Connection restored, processing queue', {
          queueStatus: status
        });
      }
    }
  }, [connectionState.status]);

  return {
    addMessage,
    processMessages
  };
};