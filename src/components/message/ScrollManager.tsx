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
  const isInitialLoad = useRef<boolean>(true);

  // Track scroll position changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentPosition = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const scrollDelta = currentPosition - lastScrollPosition.current;
      const isNearBottom = maxScroll - currentPosition < 100;
      
      shouldScrollToBottom.current = isNearBottom;
      
      logger.debug(LogCategory.STATE, 'ScrollManager', 'Scroll position changed', {
        previousPosition: lastScrollPosition.current,
        currentPosition,
        maxScroll,
        delta: scrollDelta,
        isNearBottom,
        messageCount: messages.length
      });
      
      lastScrollPosition.current = currentPosition;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, messages.length]);

  // Handle initial load and new messages
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isLoading) return;

    const shouldForceScroll = isInitialLoad.current || shouldScrollToBottom.current;
    
    if (shouldForceScroll) {
      // Clear any existing scroll timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Set a new timeout for scrolling
      scrollTimeout.current = setTimeout(() => {
        const scrollStartTime = performance.now();
        
        try {
          const targetScroll = container.scrollHeight - container.clientHeight;
          container.scrollTo({
            top: targetScroll,
            behavior: isInitialLoad.current ? 'auto' : 'smooth'
          });
          
          logger.debug(LogCategory.STATE, 'ScrollManager', 'Auto-scroll complete', {
            duration: performance.now() - scrollStartTime,
            targetScroll,
            isInitialLoad: isInitialLoad.current,
            messageCount: messages.length
          });

          isInitialLoad.current = false;
        } catch (error) {
          logger.error(LogCategory.ERROR, 'ScrollManager', 'Auto-scroll failed', {
            error,
            messageCount: messages.length
          });
        }
      }, isInitialLoad.current ? 0 : 100);
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