import { useCallback, useEffect, useRef } from 'react';
import { queueManager } from '@/utils/queue/QueueManager';
import type { QueuedMessage } from '@/utils/queue/QueueTypes';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { useConnectionState } from '@/hooks/realtime/useConnectionState';

export const useMessageQueue = () => {
  const { toast } = useToast();
  const { connectionState } = useConnectionState();
  const processingRef = useRef<boolean>(false);
  const queueStatusRef = useRef<NodeJS.Timeout>();

  // Monitor queue status
  useEffect(() => {
    const checkQueueStatus = async () => {
      const status = await queueManager.getQueueStatus();
      
      if (status.failed > 0) {
        toast({
          title: "Message Queue Warning",
          description: `${status.failed} messages failed to send. Will retry automatically.`,
          variant: "destructive",
        });
      }

      logger.debug(LogCategory.STATE, 'MessageQueue', 'Queue status update', {
        status,
        connectionState: connectionState.status
      });
    };

    queueStatusRef.current = setInterval(checkQueueStatus, 30000);
    return () => {
      if (queueStatusRef.current) {
        clearInterval(queueStatusRef.current);
      }
    };
  }, [toast]);

  const addMessage = useCallback(async (
    content: string, 
    priority: QueuedMessage['priority'] = 'medium'
  ) => {
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

      if (connectionState.status !== 'connected') {
        toast({
          title: "Message Queued",
          description: "Your message will be sent when connection is restored.",
          duration: 3000,
        });
      }
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

  const processMessages = useCallback(async (
    processor: (message: QueuedMessage) => Promise<void>
  ) => {
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
    const checkAndProcessQueue = async () => {
      if (connectionState.status === 'connected') {
        const status = await queueManager.getQueueStatus();
        if (status.pending > 0 || status.failed > 0) {
          logger.info(LogCategory.STATE, 'MessageQueue', 'Connection restored, processing queue', {
            queueStatus: status
          });
        }
      }
    };

    checkAndProcessQueue();
  }, [connectionState.status]);

  return {
    addMessage,
    processMessages,
    getQueueStatus: queueManager.getQueueStatus.bind(queueManager)
  };
};