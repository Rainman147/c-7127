import { useCallback } from 'react';
import { performanceMonitor } from '@/utils/performanceMonitoring';
import { logger, LogCategory } from '@/utils/logging';

export const usePerformanceTracking = () => {
  const trackMessageProcessing = useCallback((messageId: string, metadata?: Record<string, any>) => {
    const operationId = `message_${messageId}`;
    performanceMonitor.startOperation(operationId, 'message_processing', metadata);
    
    logger.debug(LogCategory.PERFORMANCE, 'usePerformanceTracking', 'Started tracking message:', {
      messageId,
      metadata
    });

    return {
      complete: (additionalMetadata?: Record<string, any>) => {
        const duration = performanceMonitor.endOperation(operationId, additionalMetadata);
        performanceMonitor.clearMetrics(operationId);
        return duration;
      }
    };
  }, []);

  const trackStateUpdate = useCallback((updateType: string, metadata?: Record<string, any>) => {
    const operationId = `state_update_${Date.now()}`;
    performanceMonitor.startOperation(operationId, `state_update_${updateType}`, metadata);

    return {
      complete: (additionalMetadata?: Record<string, any>) => {
        const duration = performanceMonitor.endOperation(operationId, additionalMetadata);
        performanceMonitor.clearMetrics(operationId);
        return duration;
      }
    };
  }, []);

  return {
    trackMessageProcessing,
    trackStateUpdate
  };
};