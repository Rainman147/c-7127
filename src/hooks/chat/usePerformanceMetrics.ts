import { useRef, useCallback, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';

interface PerformanceMetrics {
  renderTime: number;
  messageCount: number;
  groupCount: number;
  averageRenderTime: number;
  timestamp: string;
}

interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export const usePerformanceMetrics = (messageCount: number, groupCount: number) => {
  const renderStartTime = useRef(performance.now());
  const lastRenderTime = useRef(performance.now());
  const renderCount = useRef(0);
  const performanceMetricsInterval = useRef<NodeJS.Timeout>();

  const calculateMetrics = useCallback((): PerformanceMetrics => {
    return {
      renderTime: performance.now() - renderStartTime.current,
      messageCount,
      groupCount,
      averageRenderTime: renderCount.current > 0 
        ? (performance.now() - renderStartTime.current) / renderCount.current 
        : 0,
      timestamp: new Date().toISOString()
    };
  }, [messageCount, groupCount]);

  const monitorPerformance = useCallback(() => {
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    renderCount.current += 1;

    if (timeSinceLastRender > 16.67 || renderCount.current % 10 === 0) {
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Performance metrics', {
        ...calculateMetrics(),
        timeSinceLastRender: `${timeSinceLastRender.toFixed(2)}ms`
      });
    }

    lastRenderTime.current = currentTime;
  }, [calculateMetrics]);

  const monitorMemory = useCallback(() => {
    const extendedPerf = performance as ExtendedPerformance;
    if (extendedPerf.memory) {
      const memoryUsage = {
        usedJSHeapSize: extendedPerf.memory.usedJSHeapSize,
        totalJSHeapSize: extendedPerf.memory.totalJSHeapSize,
        timestamp: new Date().toISOString()
      };

      if (memoryUsage.usedJSHeapSize > 0.8 * memoryUsage.totalJSHeapSize) {
        logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'High memory usage detected', memoryUsage);
      }
    }
  }, []);

  useEffect(() => {
    monitorPerformance();
    
    performanceMetricsInterval.current = setInterval(monitorMemory, 30000);

    return () => {
      if (performanceMetricsInterval.current) {
        clearInterval(performanceMetricsInterval.current);
      }
    };
  }, [monitorPerformance, monitorMemory]);

  return {
    metrics: calculateMetrics(),
    renderCount: renderCount.current
  };
};