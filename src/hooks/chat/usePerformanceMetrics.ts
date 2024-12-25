import { useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import type { ErrorMetadata } from '@/types/errorTracking';

const RENDER_TIME_THRESHOLD = 16.67; // 60fps target
const NODE_COUNT_WARNING = 100;
const MEMORY_GROWTH_WARNING = 1024 * 1024; // 1MB

export const usePerformanceMetrics = (messageCount: number, groupCount: number) => {
  const metricsRef = useRef({
    renderedNodes: 0,
    lastRenderTime: performance.now(),
    scrollEvents: 0,
    cleanupCount: 0,
    baselineMemory: null as number | null,
    lastMemoryUsage: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    const memorySnapshot = (performance as any).memory?.usedJSHeapSize;
    
    if (metricsRef.current.baselineMemory === null && memorySnapshot) {
      metricsRef.current.baselineMemory = memorySnapshot;
      logger.info(LogCategory.PERFORMANCE, 'MessageList', 'Baseline memory established', {
        baselineMemory: `${(memorySnapshot / 1024 / 1024).toFixed(2)}MB`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Monitor DOM nodes in the message list
    const messageList = document.querySelector('.chat-scrollbar');
    if (messageList) {
      const nodeCount = messageList.querySelectorAll('.message-group').length;
      metricsRef.current.renderedNodes = nodeCount;
      
      if (nodeCount > NODE_COUNT_WARNING) {
        const metadata: ErrorMetadata = {
          component: 'MessageList',
          severity: 'medium', // Changed from 'warning' to 'medium'
          errorType: 'performance',
          operation: 'virtual-scrolling',
          timestamp: new Date().toISOString(), // Added timestamp
          additionalInfo: {
            nodeCount,
            messageCount,
            groupCount,
            renderTime: performance.now() - startTime
          }
        };
        
        ErrorTracker.trackError(
          new Error(`High DOM node count detected: ${nodeCount}`),
          metadata
        );
      }
      
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Rendered nodes metrics', {
        visibleNodes: nodeCount,
        totalMessages: messageCount,
        messageGroups: groupCount,
        renderTime: performance.now() - startTime
      });
    }

    // Monitor memory usage
    if (memorySnapshot) {
      const memoryGrowth = memorySnapshot - metricsRef.current.lastMemoryUsage;
      metricsRef.current.lastMemoryUsage = memorySnapshot;

      if (memoryGrowth > MEMORY_GROWTH_WARNING) {
        logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'Significant memory growth detected', {
          growth: `${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`,
          currentUsage: `${(memorySnapshot / 1024 / 1024).toFixed(2)}MB`,
          messageCount,
          groupCount
        });
      }
    }

    // Monitor scroll performance
    const handleScroll = () => {
      metricsRef.current.scrollEvents++;
      const scrollTime = performance.now();
      const timeSinceLastRender = scrollTime - metricsRef.current.lastRenderTime;
      
      if (timeSinceLastRender > RENDER_TIME_THRESHOLD) {
        logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'Scroll performance degraded', {
          timeSinceLastRender: `${timeSinceLastRender.toFixed(2)}ms`,
          scrollEvents: metricsRef.current.scrollEvents,
          renderedNodes: metricsRef.current.renderedNodes,
          fps: 1000 / timeSinceLastRender
        });
      }
      
      metricsRef.current.lastRenderTime = scrollTime;
    };

    messageList?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      messageList?.removeEventListener('scroll', handleScroll);
      metricsRef.current.cleanupCount++;
      
      // Log cleanup metrics
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Component cleanup metrics', {
        finalNodeCount: metricsRef.current.renderedNodes,
        totalScrollEvents: metricsRef.current.scrollEvents,
        cleanupCount: metricsRef.current.cleanupCount,
        unmountTime: performance.now() - startTime,
        memoryDelta: memorySnapshot ? 
          memorySnapshot - (metricsRef.current.baselineMemory || 0) : 
          'Not available'
      });
    };
  }, [messageCount, groupCount]);

  return {
    metrics: {
      renderedNodes: metricsRef.current.renderedNodes,
      scrollEvents: metricsRef.current.scrollEvents,
      cleanupCount: metricsRef.current.cleanupCount,
      memoryUsage: metricsRef.current.lastMemoryUsage,
      baselineMemory: metricsRef.current.baselineMemory
    }
  };
};
