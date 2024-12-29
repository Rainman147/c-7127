import { useCallback, useRef, useState, RefObject, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import { logger, LogCategory } from '@/utils/logging';

const SCROLL_THRESHOLD = 100;

export const useScrollManager = (listRef: RefObject<List>) => {
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastScrollTopRef = useRef(0);
  const scrollStartTime = useRef<number>();

  const handleScroll = useCallback(({ scrollOffset, scrollDirection }) => {
    const isScrollingUp = scrollOffset < lastScrollTopRef.current;
    lastScrollTopRef.current = scrollOffset;

    logger.debug(LogCategory.STATE, 'ScrollManager', 'Scroll event:', {
      scrollOffset,
      scrollDirection,
      isScrollingUp,
      shouldAutoScroll,
      timeSinceLastScroll: scrollStartTime.current 
        ? Date.now() - scrollStartTime.current 
        : 'first scroll',
      timestamp: new Date().toISOString()
    });

    if (isScrollingUp) {
      setShouldAutoScroll(false);
    }

    if (listRef.current) {
      const list = listRef.current as any;
      const isAtBottom = scrollOffset >= list._outerRef.scrollHeight - list._outerRef.clientHeight - SCROLL_THRESHOLD;
      if (isAtBottom) {
        setShouldAutoScroll(true);
        logger.debug(LogCategory.STATE, 'ScrollManager', 'Reached bottom, enabling auto-scroll');
      }
    }
  }, []);

  useEffect(() => {
    if (listRef.current && shouldAutoScroll) {
      scrollStartTime.current = performance.now();
      
      logger.debug(LogCategory.STATE, 'ScrollManager', 'Auto-scrolling to bottom:', {
        scrollStartTime: new Date(scrollStartTime.current).toISOString()
      });
      
      try {
        const list = listRef.current;
        const itemCount = list.props.itemCount;
        if (itemCount > 0) {
          list.scrollToItem(itemCount - 1, 'end');
          
          logger.debug(LogCategory.STATE, 'ScrollManager', 'Auto-scroll complete:', {
            duration: performance.now() - (scrollStartTime.current || 0),
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error(LogCategory.ERROR, 'ScrollManager', 'Auto-scroll failed:', {
          error,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, [shouldAutoScroll]);

  return {
    handleScroll,
    shouldAutoScroll
  };
};