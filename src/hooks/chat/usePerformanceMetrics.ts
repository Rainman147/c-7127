import { useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';

export const usePerformanceMetrics = (messageCount: number, groupCount: number) => {
  const metricsRef = useRef({
    renderedNodes: 0,
    lastRenderTime: performance.now(),
    scrollEvents: 0,
    cleanupCount: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    
    // Monitor DOM nodes in the message list
    const messageList = document.querySelector('.chat-scrollbar');
    if (messageList) {
      const nodeCount = messageList.querySelectorAll('.message-group').length;
      metricsRef.current.renderedNodes = nodeCount;
      
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Rendered nodes metrics', {
        visibleNodes: nodeCount,
        totalMessages: messageCount,
        messageGroups: groupCount,
        renderTime: performance.now() - startTime
      });
    }

    // Monitor scroll performance
    const handleScroll = () => {
      metricsRef.current.scrollEvents++;
      const scrollTime = performance.now();
      
      if (scrollTime - metricsRef.current.lastRenderTime > 16.67) { // 60fps threshold
        logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'Scroll performance degraded', {
          timeSinceLastRender: scrollTime - metricsRef.current.lastRenderTime,
          scrollEvents: metricsRef.current.scrollEvents,
          renderedNodes: metricsRef.current.renderedNodes
        });
      }
      
      metricsRef.current.lastRenderTime = scrollTime;
    };

    messageList?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      messageList?.removeEventListener('scroll', handleScroll);
      metricsRef.current.cleanupCount++;
      
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Component cleanup metrics', {
        finalNodeCount: metricsRef.current.renderedNodes,
        totalScrollEvents: metricsRef.current.scrollEvents,
        cleanupCount: metricsRef.current.cleanupCount,
        unmountTime: performance.now() - startTime
      });
    };
  }, [messageCount, groupCount]);

  return {
    metrics: {
      renderedNodes: metricsRef.current.renderedNodes,
      scrollEvents: metricsRef.current.scrollEvents,
      cleanupCount: metricsRef.current.cleanupCount
    }
  };
};