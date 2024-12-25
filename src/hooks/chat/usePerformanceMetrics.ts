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

// Adjusted thresholds based on typical web application memory patterns
const MEMORY_WARNING_THRESHOLD = 0.75; // 75% of total heap size
const MEMORY_CRITICAL_THRESHOLD = 0.90; // 90% of total heap size
const RENDER_TIME_THRESHOLD = 16.67; // ms (targeting 60fps)

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
        groupCount,
        renderCount: renderCount.current,
        totalRuntime: `${(currentTime - renderStartTime.current).toFixed(2)}ms`
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
        jsHeapSizeLimit: extendedPerf.memory.jsHeapSizeLimit,
        usageRatio: extendedPerf.memory.usedJSHeapSize / extendedPerf.memory.totalJSHeapSize,
        heapLimitRatio: extendedPerf.memory.totalJSHeapSize / extendedPerf.memory.jsHeapSizeLimit,
        timestamp: new Date().toISOString()
      };

      if (memoryUsage.usageRatio > MEMORY_CRITICAL_THRESHOLD) {
        logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'CRITICAL: Memory usage extremely high', {
          ...memoryUsage,
          thresholdExceeded: `${(memoryUsage.usageRatio * 100).toFixed(1)}%`,
          heapLimitProximity: `${(memoryUsage.heapLimitRatio * 100).toFixed(1)}%`,
          messageMetrics: {
            totalMessages: messageCount,
            messageGroups: groupCount,
            averageRenderTime: calculateMetrics().averageRenderTime
          },
          recommendedActions: [
            'Implement virtual scrolling',
            'Add pagination',
            'Clear message history',
            'Reduce message group size'
          ]
        });
      } else if (memoryUsage.usageRatio > MEMORY_WARNING_THRESHOLD) {
        logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'High memory usage detected', {
          ...memoryUsage,
          thresholdExceeded: `${(memoryUsage.usageRatio * 100).toFixed(1)}%`,
          heapLimitProximity: `${(memoryUsage.heapLimitRatio * 100).toFixed(1)}%`,
          messageMetrics: {
            totalMessages: messageCount,
            messageGroups: groupCount
          },
          recommendedAction: 'Consider implementing virtual scrolling or pagination'
        });
      } else {
        logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Memory usage normal', memoryUsage);
      }
    }
  }, [messageCount, groupCount, calculateMetrics]);

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