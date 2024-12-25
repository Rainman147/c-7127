import { useRef, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { MemorySnapshot, MemoryMetrics } from './types';

const MEMORY_WARNING_THRESHOLD = 0.75;
const MEMORY_CRITICAL_THRESHOLD = 0.90;

export const useMemoryMetrics = (messageCount: number) => {
  const baselineMemoryUsage = useRef<number | null>(null);
  const memorySnapshots = useRef<MemorySnapshot[]>([]);

  const analyzeMemoryTrend = useCallback(() => {
    if (memorySnapshots.current.length < 2) return null;

    const recentSnapshots = memorySnapshots.current.slice(-5);
    const memoryGrowthRate = recentSnapshots.reduce((acc, curr, idx, arr) => {
      if (idx === 0) return acc;
      const prev = arr[idx - 1];
      const growth = (curr.usedJSHeapSize - prev.usedJSHeapSize) / 
                    (curr.timestamp - prev.timestamp);
      return acc + growth;
    }, 0) / (recentSnapshots.length - 1);

    return {
      averageGrowthRate: memoryGrowthRate,
      isAccumulating: memoryGrowthRate > 1024 * 100, // 100KB/s threshold
      snapshotCount: memorySnapshots.current.length,
      timespan: memorySnapshots.current[memorySnapshots.current.length - 1].timestamp - 
                memorySnapshots.current[0].timestamp
    };
  }, []);

  const monitorMemory = useCallback(() => {
    const extendedPerf = performance as { memory?: { 
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    }};

    if (extendedPerf.memory) {
      if (baselineMemoryUsage.current === null) {
        baselineMemoryUsage.current = extendedPerf.memory.usedJSHeapSize;
        logger.info(LogCategory.PERFORMANCE, 'MemoryMetrics', 'Baseline memory established', {
          baselineUsage: `${(baselineMemoryUsage.current / 1024 / 1024).toFixed(2)}MB`,
          timestamp: new Date().toISOString()
        });
      }

      memorySnapshots.current.push({
        timestamp: performance.now(),
        usedJSHeapSize: extendedPerf.memory.usedJSHeapSize,
        messageCount
      });

      if (memorySnapshots.current.length > 50) {
        memorySnapshots.current.shift();
      }

      const metrics: MemoryMetrics = {
        usedJSHeapSize: extendedPerf.memory.usedJSHeapSize,
        totalJSHeapSize: extendedPerf.memory.totalJSHeapSize,
        jsHeapSizeLimit: extendedPerf.memory.jsHeapSizeLimit,
        usageRatio: extendedPerf.memory.usedJSHeapSize / extendedPerf.memory.totalJSHeapSize,
        heapLimitRatio: extendedPerf.memory.totalJSHeapSize / extendedPerf.memory.jsHeapSizeLimit,
        baselineUsage: baselineMemoryUsage.current,
        memoryGrowth: extendedPerf.memory.usedJSHeapSize - baselineMemoryUsage.current,
        memoryPerMessage: messageCount > 0 ? 
          (extendedPerf.memory.usedJSHeapSize - baselineMemoryUsage.current) / messageCount : 0
      };

      const trend = analyzeMemoryTrend();
      
      if (metrics.usageRatio > MEMORY_CRITICAL_THRESHOLD) {
        logger.warn(LogCategory.PERFORMANCE, 'MemoryMetrics', 'CRITICAL: Memory usage extremely high', {
          ...metrics,
          trend,
          recommendations: [
            'Implement virtual scrolling',
            'Add pagination',
            'Clear message history',
            'Reduce message group size'
          ]
        });
      } else if (metrics.usageRatio > MEMORY_WARNING_THRESHOLD) {
        logger.warn(LogCategory.PERFORMANCE, 'MemoryMetrics', 'High memory usage detected', {
          ...metrics,
          trend
        });
      } else {
        logger.debug(LogCategory.PERFORMANCE, 'MemoryMetrics', 'Memory usage normal', metrics);
      }

      return metrics;
    }
    
    return null;
  }, [messageCount, analyzeMemoryTrend]);

  return { monitorMemory, analyzeMemoryTrend };
};