import { useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { logScrollMetrics, measureScrollPerformance } from '@/utils/scrollTesting';

export const useScrollMetrics = (containerRef: React.RefObject<HTMLDivElement>) => {
  const metricsInterval = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Skip if containerRef is null or not initialized
    if (!containerRef?.current) {
      logger.debug(LogCategory.STATE, 'ScrollMetrics', 'Container ref not ready', {
        timestamp: new Date().toISOString()
      });
      return;
    }

    const container = containerRef.current;

    // Log initial metrics
    logScrollMetrics(container, 'Initial metrics');

    // Set up periodic metrics logging
    metricsInterval.current = setInterval(() => {
      // Check if container is still valid before logging
      if (container && document.body.contains(container)) {
        logScrollMetrics(container, 'Periodic metrics check');
      } else {
        // Clear interval if container is no longer valid
        if (metricsInterval.current) {
          clearInterval(metricsInterval.current);
        }
      }
    }, 5000); // Log every 5 seconds during testing

    return () => {
      if (metricsInterval.current) {
        clearInterval(metricsInterval.current);
      }
    };
  }, [containerRef]); // Add containerRef as dependency

  return {
    logMetrics: (event: string, data?: Record<string, any>) => {
      if (containerRef?.current) {
        return logScrollMetrics(containerRef.current, event, data);
      }
      logger.debug(LogCategory.STATE, 'ScrollMetrics', 'Metrics logging skipped - no container', {
        event,
        timestamp: new Date().toISOString()
      });
    },
    measureOperation: measureScrollPerformance
  };
};