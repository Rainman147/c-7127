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

  // Track scroll position changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentPosition = container.scrollTop;
      logger.debug(LogCategory.STATE, 'ScrollHandler', 'Scroll position changed', {
        previousPosition: lastScrollPosition.current,
        currentPosition,
        delta: currentPosition - lastScrollPosition.current,
        viewportHeight,
        messageCount: messages.length
      });
      
      lastScrollPosition.current = currentPosition;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length, viewportHeight, containerRef]);

  // Enhanced scroll to bottom
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      const scrollStartTime = performance.now();
      
      try {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        logger.debug(LogCategory.STATE, 'ScrollHandler', 'Scroll complete', {
          duration: performance.now() - scrollStartTime,
          messageCount: messages.length
        });
      } catch (error) {
        logger.error(LogCategory.ERROR, 'ScrollHandler', 'Scroll failed', { error });
      }
    }
  }, [messages.length, viewportHeight, keyboardVisible]);
};