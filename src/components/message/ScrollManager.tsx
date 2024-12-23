import { useEffect, useRef, RefObject } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

interface ScrollManagerProps {
  containerRef: RefObject<HTMLDivElement>;
  messages: Message[];
  isLoading: boolean;
}

export const useScrollManager = ({ containerRef, messages, isLoading }: ScrollManagerProps) => {
  const lastScrollPosition = useRef<number>(0);
  const shouldScrollToBottom = useRef<boolean>(true);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // Track scroll position changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentPosition = container.scrollTop;
      const scrollDelta = currentPosition - lastScrollPosition.current;
      const isNearBottom = container.scrollHeight - currentPosition - container.clientHeight < 100;
      
      shouldScrollToBottom.current = isNearBottom;
      
      logger.debug(LogCategory.STATE, 'ScrollManager', 'Scroll position changed', {
        previousPosition: lastScrollPosition.current,
        currentPosition,
        delta: scrollDelta,
        isNearBottom,
        messageCount: messages.length
      });
      
      lastScrollPosition.current = currentPosition;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, messages.length]);

  // Handle automatic scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isLoading) return;

    if (shouldScrollToBottom.current) {
      // Clear any existing scroll timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Set a new timeout for scrolling
      scrollTimeout.current = setTimeout(() => {
        const scrollStartTime = performance.now();
        
        try {
          container.scrollTop = container.scrollHeight;
          
          logger.debug(LogCategory.STATE, 'ScrollManager', 'Auto-scroll complete', {
            duration: performance.now() - scrollStartTime,
            finalScrollPosition: container.scrollTop,
            messageCount: messages.length
          });
        } catch (error) {
          logger.error(LogCategory.ERROR, 'ScrollManager', 'Auto-scroll failed', {
            error,
            messageCount: messages.length
          });
        }
      }, 100);
    }

    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [messages, containerRef, isLoading]);

  return {
    isNearBottom: shouldScrollToBottom.current
  };
};