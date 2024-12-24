import { useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';

interface ScrollHandlerProps {
  messages: any[];
  viewportHeight: number;
  keyboardVisible: boolean;
  connectionState: any;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const useScrollHandler = ({
  messages,
  viewportHeight,
  keyboardVisible,
  connectionState,
  containerRef
}: ScrollHandlerProps) => {
  const lastScrollPosition = useRef<number>(0);
  const scrollMetrics = useRef({
    scrollCount: 0,
    lastScrollTime: Date.now(),
    averageScrollDuration: 0
  });

  // Enhanced scroll position tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentPosition = container.scrollTop;
      const scrollTime = Date.now();
      const scrollDuration = scrollTime - scrollMetrics.current.lastScrollTime;
      
      // Update scroll metrics
      scrollMetrics.current = {
        scrollCount: scrollMetrics.current.scrollCount + 1,
        lastScrollTime: scrollTime,
        averageScrollDuration: 
          (scrollMetrics.current.averageScrollDuration * scrollMetrics.current.scrollCount + scrollDuration) / 
          (scrollMetrics.current.scrollCount + 1)
      };

      // Log detailed scroll metrics for performance monitoring
      logger.debug(LogCategory.STATE, 'ScrollHandler', 'Scroll metrics updated', {
        previousPosition: lastScrollPosition.current,
        currentPosition,
        delta: currentPosition - lastScrollPosition.current,
        viewportHeight,
        messageCount: messages.length,
        averageScrollDuration: scrollMetrics.current.averageScrollDuration,
        totalScrolls: scrollMetrics.current.scrollCount,
        timestamp: new Date().toISOString()
      });
      
      lastScrollPosition.current = currentPosition;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length, viewportHeight, containerRef]);

  // Optimized scroll to bottom with performance tracking
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      const scrollStartTime = performance.now();
      
      try {
        const container = containerRef.current;
        const previousScroll = container.scrollTop;
        container.scrollTop = container.scrollHeight;
        
        logger.debug(LogCategory.STATE, 'ScrollHandler', 'Scroll to bottom complete', {
          duration: performance.now() - scrollStartTime,
          messageCount: messages.length,
          scrollDistance: container.scrollHeight - previousScroll,
          success: Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 1,
          viewportHeight,
          keyboardVisible,
          connectionState: connectionState?.toString() || 'unknown'
        });
      } catch (error) {
        logger.error(LogCategory.ERROR, 'ScrollHandler', 'Scroll to bottom failed', { 
          error,
          messageCount: messages.length,
          viewportHeight,
          keyboardVisible 
        });
      }
    }
  }, [messages.length, viewportHeight, keyboardVisible, connectionState]);

  return {
    metrics: scrollMetrics.current,
    lastPosition: lastScrollPosition.current
  };
};