import { useState, useEffect } from 'react';
import { queueManager } from '@/utils/queue/QueueManager';
import { logger, LogCategory } from '@/utils/logging';

export interface QueueMetrics {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  totalMessages: number;
  oldestMessage: number | null;
  averageProcessingTime: number | null;
  lastUpdated: number;
}

export const useQueueMonitor = (refreshInterval: number = 5000) => {
  const [metrics, setMetrics] = useState<QueueMetrics>({
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    totalMessages: 0,
    oldestMessage: null,
    averageProcessingTime: null,
    lastUpdated: Date.now()
  });

  useEffect(() => {
    const updateMetrics = async () => {
      try {
        const status = await queueManager.getQueueStatus();
        setMetrics({
          ...status,
          lastUpdated: Date.now()
        });

        logger.debug(LogCategory.METRICS, 'QueueMonitor', 'Queue metrics updated', {
          metrics: status,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(LogCategory.ERROR, 'QueueMonitor', 'Failed to update queue metrics', {
          error,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Initial update
    updateMetrics();

    // Set up periodic updates
    const intervalId = setInterval(updateMetrics, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval]);

  return metrics;
};