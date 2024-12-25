import { useEffect, useRef, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { debounce } from 'lodash';

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
  const isScrolling = useRef(false);

  // Debounced scroll metrics update
  const updateScrollMetrics = useCallback(
    debounce((currentPosition: number, scrollTime: number) => {
      const scrollDuration = scrollTime - scrollMetrics.current.lastScrollTime;
      
      scrollMetrics.current = {
        scrollCount: scrollMetrics.current.scrollCount + 1,
        lastScrollTime: scrollTime,
        averageScrollDuration: 
          (scrollMetrics.current.averageScrollDuration * scrollMetrics.current.scrollCount + scrollDuration) / 
          (scrollMetrics.current.scrollCount + 1)
      };

      logger.debug(LogCategory.STATE, 'ScrollHandler', 'Scroll metrics updated', {
        previousPosition: lastScrollPosition.current,
        currentPosition,
        delta: currentPosition - lastScrollPosition.current,
        viewportHeight,
        messageCount: messages.length,
        averageScrollDuration: scrollMetrics.current.averageScrollDuration,
        totalScrolls: scrollMetrics.current.scrollCount
      });
      
      lastScrollPosition.current = currentPosition;
      isScrolling.current = false;
    }, 150),
    [messages.length, viewportHeight]
  );

  // Optimized scroll event handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isScrolling.current) {
        isScrolling.current = true;
        requestAnimationFrame(() => {
          updateScrollMetrics(container.scrollTop, Date.now());
        });
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [updateScrollMetrics]);

  // Optimized scroll to bottom
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      const scrollStartTime = performance.now();
      
      try {
        const container = containerRef.current;
        const previousScroll = container.scrollTop;

        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
          
          logger.debug(LogCategory.STATE, 'ScrollHandler', 'Scroll to bottom complete', {
            duration: performance.now() - scrollStartTime,
            messageCount: messages.length,
            scrollDistance: container.scrollHeight - previousScroll,
            success: Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 1,
            viewportHeight,
            keyboardVisible
          });
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
  }, [messages.length, viewportHeight, keyboardVisible]);

  return {
    metrics: scrollMetrics.current,
    lastPosition: lastScrollPosition.current,
    isScrolling: isScrolling.current
  };
};