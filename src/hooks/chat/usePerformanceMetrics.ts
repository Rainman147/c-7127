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
  const baselineMemoryUsage = useRef<number | null>(null);

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

    // Log render time issues
    if (timeSinceLastRender > RENDER_TIME_THRESHOLD) {
      logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'Render time exceeded threshold', {
        renderTime: `${timeSinceLastRender.toFixed(2)}ms`,
        threshold: `${RENDER_TIME_THRESHOLD}ms`,
        messageCount,
        groupCount,
        renderCount: renderCount.current,
        totalRuntime: `${(currentTime - renderStartTime.current).toFixed(2)}ms`,
        timePerMessage: messageCount > 0 ? timeSinceLastRender / messageCount : 0
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
      // Set baseline memory usage on first run
      if (baselineMemoryUsage.current === null) {
        baselineMemoryUsage.current = extendedPerf.memory.usedJSHeapSize;
      }

      const memoryUsage = {
        usedJSHeapSize: extendedPerf.memory.usedJSHeapSize,
        totalJSHeapSize: extendedPerf.memory.totalJSHeapSize,
        jsHeapSizeLimit: extendedPerf.memory.jsHeapSizeLimit,
        usageRatio: extendedPerf.memory.usedJSHeapSize / extendedPerf.memory.totalJSHeapSize,
        heapLimitRatio: extendedPerf.memory.totalJSHeapSize / extendedPerf.memory.jsHeapSizeLimit,
        baselineUsage: baselineMemoryUsage.current,
        memoryGrowth: extendedPerf.memory.usedJSHeapSize - baselineMemoryUsage.current,
        memoryPerMessage: messageCount > 0 ? 
          (extendedPerf.memory.usedJSHeapSize - baselineMemoryUsage.current) / messageCount : 0,
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
            averageRenderTime: calculateMetrics().averageRenderTime,
            memoryPerMessage: `${(memoryUsage.memoryPerMessage / 1024 / 1024).toFixed(2)}MB`,
            totalMemoryGrowth: `${(memoryUsage.memoryGrowth / 1024 / 1024).toFixed(2)}MB`
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
            messageGroups: groupCount,
            memoryPerMessage: `${(memoryUsage.memoryPerMessage / 1024 / 1024).toFixed(2)}MB`,
            totalMemoryGrowth: `${(memoryUsage.memoryGrowth / 1024 / 1024).toFixed(2)}MB`
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