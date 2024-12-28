import { useEffect, useRef, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useMessageQueue } from '@/hooks/realtime/useMessageQueue';
import { useRealTime } from '@/contexts/RealTimeContext';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '@/types/chat';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void,
  componentId: string
) => {
  const queryClient = useQueryClient();
  const { connectionState, subscribeToMessage, unsubscribeFromMessage } = useRealTime();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const subscriptionStatusRef = useRef<'active' | 'inactive'>('inactive');
  const messageProcessingTimeRef = useRef<number>(0);
  const metrics = useRef({
    updates: 0,
    errors: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0
  });

  const processMessage = useCallback((content: string) => {
    const startTime = performance.now();
    try {
      logger.debug(LogCategory.STATE, 'MessageRealtime', 'Processing message update', {
        messageId,
        componentId,
        contentLength: content.length,
        timestamp: new Date().toISOString(),
        timeSinceLastUpdate: Date.now() - lastUpdateTimeRef.current,
        metrics: metrics.current
      });

      addToQueue(messageId!, content);
      processQueue(editedContent, setEditedContent);
      
      lastUpdateTimeRef.current = Date.now();
      const processingTime = performance.now() - startTime;
      messageProcessingTimeRef.current = processingTime;
      
      // Update metrics
      metrics.current.updates++;
      metrics.current.totalProcessingTime += processingTime;
      metrics.current.averageProcessingTime = 
        metrics.current.totalProcessingTime / metrics.current.updates;

      const messages = queryClient.getQueryData<Message[]>(['messages']) || [];
      
      logger.info(LogCategory.PERFORMANCE, 'MessageRealtime', 'Message processing completed', {
        messageId,
        processingTime,
        queueSize: messages.length,
        metrics: metrics.current,
        timestamp: new Date().toISOString()
      });

      queryClient.invalidateQueries({ queryKey: ['messages'] });

    } catch (error) {
      metrics.current.errors++;
      logger.error(LogCategory.STATE, 'MessageRealtime', 'Failed to process message', {
        messageId,
        componentId,
        error: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack : undefined,
        processingTime: performance.now() - startTime,
        metrics: metrics.current,
        timestamp: new Date().toISOString()
      });
    }
  }, [messageId, editedContent, setEditedContent, addToQueue, processQueue, componentId, queryClient]);

  useEffect(() => {
    if (!messageId) {
      logger.debug(LogCategory.COMMUNICATION, 'MessageRealtime', 'No message ID provided', {
        componentId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Setting up message subscription', {
      messageId,
      componentId,
      connectionState: connectionState.status,
      timestamp: new Date().toISOString()
    });

    subscribeToMessage(messageId, componentId, processMessage);
    subscriptionStatusRef.current = 'active';

    return () => {
      if (messageId && subscriptionStatusRef.current === 'active') {
        logger.info(LogCategory.WEBSOCKET, 'MessageRealtime', 'Cleaning up message subscription', {
          messageId,
          componentId,
          lastUpdateAge: Date.now() - lastUpdateTimeRef.current,
          metrics: metrics.current,
          timestamp: new Date().toISOString()
        });
        
        unsubscribeFromMessage(messageId, componentId);
        clearQueue();
        subscriptionStatusRef.current = 'inactive';
      }
    };
  }, [
    messageId,
    componentId,
    subscribeToMessage,
    unsubscribeFromMessage,
    clearQueue,
    processMessage,
    connectionState.status
  ]);

  return {
    connectionState,
    lastUpdateTime: lastUpdateTimeRef.current,
    subscriptionStatus: subscriptionStatusRef.current,
    retryCount: connectionState.retryCount,
    metrics: metrics.current
  };
};