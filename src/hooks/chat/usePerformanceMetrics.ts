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

const MEMORY_WARNING_THRESHOLD = 0.85; // 85% of total heap size
const RENDER_TIME_THRESHOLD = 16.67; // ms

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

    if (timeSinceLastRender > RENDER_TIME_THRESHOLD) {
      logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'Render time exceeded threshold', {
        renderTime: `${timeSinceLastRender.toFixed(2)}ms`,
        threshold: `${RENDER_TIME_THRESHOLD}ms`,
        messageCount,
        groupCount
      });
    }

    logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Performance metrics', {
      ...calculateMetrics(),
      timeSinceLastRender: `${timeSinceLastRender.toFixed(2)}ms`
    });

    lastRenderTime.current = currentTime;
  }, [calculateMetrics, messageCount, groupCount]);

  const monitorMemory = useCallback(() => {
    const extendedPerf = performance as ExtendedPerformance;
    if (extendedPerf.memory) {
      const memoryUsage = {
        usedJSHeapSize: extendedPerf.memory.usedJSHeapSize,
        totalJSHeapSize: extendedPerf.memory.totalJSHeapSize,
        usageRatio: extendedPerf.memory.usedJSHeapSize / extendedPerf.memory.totalJSHeapSize,
        timestamp: new Date().toISOString()
      };

      if (memoryUsage.usageRatio > MEMORY_WARNING_THRESHOLD) {
        logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'High memory usage detected', {
          ...memoryUsage,
          thresholdExceeded: `${(memoryUsage.usageRatio * 100).toFixed(1)}%`,
          recommendedAction: 'Consider implementing virtual scrolling or pagination'
        });
      } else {
        logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Memory usage normal', memoryUsage);
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