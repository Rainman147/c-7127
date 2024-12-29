import { useCallback, useRef, useState, RefObject, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import { logger, LogCategory } from '@/utils/logging';

const SCROLL_THRESHOLD = 100;

export const useScrollManager = (listRef: RefObject<List>) => {
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastScrollTopRef = useRef(0);

  const handleScroll = useCallback(({ scrollOffset, scrollDirection }) => {
    const isScrollingUp = scrollOffset < lastScrollTopRef.current;
    lastScrollTopRef.current = scrollOffset;

    if (isScrollingUp) {
      setShouldAutoScroll(false);
    }

    if (listRef.current) {
      const list = listRef.current as any;
      const isAtBottom = scrollOffset >= list._outerRef.scrollHeight - list._outerRef.clientHeight - SCROLL_THRESHOLD;
      if (isAtBottom) {
        setShouldAutoScroll(true);
      }
    }

    logger.debug(LogCategory.STATE, 'ScrollManager', 'Scroll event', {
      scrollOffset,
      scrollDirection,
      shouldAutoScroll
    });
  }, []);

  useEffect(() => {
    if (listRef.current && shouldAutoScroll) {
      const scrollStartTime = performance.now();
      
      logger.debug(LogCategory.STATE, 'ScrollManager', 'Scrolling to bottom', {
        scrollStartTime
      });
      
      try {
        const list = listRef.current;
        const itemCount = list.props.itemCount;
        if (itemCount > 0) {
          list.scrollToItem(itemCount - 1, 'end');
        }
        
        logger.debug(LogCategory.STATE, 'ScrollManager', 'Scroll complete', {
          duration: performance.now() - scrollStartTime
        });
      } catch (error) {
        logger.error(LogCategory.ERROR, 'ScrollManager', 'Scroll failed', {
          error
        });
      }
    }
  }, [shouldAutoScroll]);

  return {
    handleScroll,
    shouldAutoScroll
  };
};