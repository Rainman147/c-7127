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
  const lastMessageCount = useRef<number>(0);

  // Track container dimensions and scroll state
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      logger.warn(LogCategory.STATE, 'ScrollManager', 'Container ref not available');
      return;
    }

    // Log initial container state
    logger.debug(LogCategory.STATE, 'ScrollManager', 'Container initialized', {
      height: container.clientHeight,
      scrollHeight: container.scrollHeight,
      offsetHeight: container.offsetHeight,
      style: container.style.height,
      hasScrollbar: container.scrollHeight > container.clientHeight,
      messageCount: messages.length
    });

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
        containerHeight: container.clientHeight,
        scrollHeight: container.scrollHeight,
        messageCount: messages.length
      });
      
      lastScrollPosition.current = currentPosition;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, messages.length]);

  // Handle messages updates and scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isLoading) return;

    const messageCountChanged = messages.length !== lastMessageCount.current;
    const shouldForceScroll = isInitialLoad.current || shouldScrollToBottom.current;
    
    logger.debug(LogCategory.STATE, 'ScrollManager', 'Messages updated', {
      previousCount: lastMessageCount.current,
      newCount: messages.length,
      messageCountChanged,
      shouldForceScroll,
      isInitialLoad: isInitialLoad.current,
      containerHeight: container.clientHeight,
      scrollHeight: container.scrollHeight
    });

    lastMessageCount.current = messages.length;
    
    if (shouldForceScroll) {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

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
            messageCount: messages.length,
            containerHeight: container.clientHeight,
            scrollHeight: container.scrollHeight
          });

          isInitialLoad.current = false;
        } catch (error) {
          logger.error(LogCategory.ERROR, 'ScrollManager', 'Auto-scroll failed', {
            error,
            messageCount: messages.length,
            containerHeight: container.clientHeight,
            scrollHeight: container.scrollHeight
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