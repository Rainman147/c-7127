import { useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { logScrollMetrics, measureScrollPerformance } from '@/utils/scrollTesting';

export const useScrollMetrics = (containerRef: React.RefObject<HTMLDivElement>) => {
  const metricsInterval = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Log initial metrics
    logScrollMetrics(container, 'Initial metrics');

    // Set up periodic metrics logging
    metricsInterval.current = setInterval(() => {
      if (container) {
        logScrollMetrics(container, 'Periodic metrics check');
      }
    }, 5000); // Log every 5 seconds during testing

    return () => {
      if (metricsInterval.current) {
        clearInterval(metricsInterval.current);
      }
    };
  }, []);

  return {
    logMetrics: (event: string, data?: Record<string, any>) => {
      if (containerRef.current) {
        return logScrollMetrics(containerRef.current, event, data);
      }
    },
    measureOperation: measureScrollPerformance
  };
};