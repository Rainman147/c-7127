import { useRef, RefObject, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useScrollMetrics } from './ScrollManagerMetrics';
import { useScrollQueue } from './useScrollQueue';
import { useScrollDimensions } from './useScrollDimensions';
import type { Message } from '@/types/chat';

interface ScrollManagerProps {
  containerRef: RefObject<HTMLDivElement>;
  messages: Message[];
  isLoading: boolean;
  isMounted: boolean;
}

export const useScrollManager = ({ 
  containerRef, 
  messages, 
  isLoading,
  isMounted 
}: ScrollManagerProps) => {
  const lastScrollPosition = useRef<number>(0);
  const shouldScrollToBottom = useRef<boolean>(true);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const isInitialLoad = useRef<boolean>(true);
  const lastMessageCount = useRef<number>(0);
  const scrollAttempts = useRef<number>(0);
  const { logMetrics, measureOperation } = useScrollMetrics(containerRef);
  const { processQueue, queueScroll } = useScrollQueue();

  // Enhanced scroll position tracking
  const handleScroll = (currentPosition: number, maxScroll: number) => {
    const scrollDelta = currentPosition - lastScrollPosition.current;
    const isNearBottom = maxScroll - currentPosition < 100;
    
    shouldScrollToBottom.current = isNearBottom;
    
    logger.debug(LogCategory.STATE, 'ScrollManager', 'Scroll position changed', {
      previousPosition: lastScrollPosition.current,
      currentPosition,
      maxScroll,
      delta: scrollDelta,
      isNearBottom,
      messageCount: messages.length,
      isInitialLoad: isInitialLoad.current,
      scrollAttempts: scrollAttempts.current,
      containerDimensions: containerRef.current ? {
        scrollHeight: containerRef.current.scrollHeight,
        clientHeight: containerRef.current.clientHeight,
        scrollTop: containerRef.current.scrollTop
      } : null,
      timestamp: new Date().toISOString()
    });
    
    lastScrollPosition.current = currentPosition;
  };

  useScrollDimensions(containerRef, isMounted, handleScroll);

  // Enhanced message updates and scrolling tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isLoading || !isMounted) {
      logger.debug(LogCategory.STATE, 'ScrollManager', 'Skipping scroll update', {
        hasContainer: !!container,
        containerDimensions: container ? {
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          scrollTop: container.scrollTop
        } : null,
        isLoading,
        isMounted,
        messageCount: messages.length,
        lastMessageCount: lastMessageCount.current,
        isInitialLoad: isInitialLoad.current,
        shouldScrollToBottom: shouldScrollToBottom.current,
        scrollAttempts: scrollAttempts.current,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const messageCountChanged = messages.length !== lastMessageCount.current;
    const shouldForceScroll = isInitialLoad.current || shouldScrollToBottom.current;
    
    logger.debug(LogCategory.STATE, 'ScrollManager', 'Messages updated', {
      previousCount: lastMessageCount.current,
      newCount: messages.length,
      messageCountChanged,
      shouldForceScroll,
      isInitialLoad: isInitialLoad.current,
      shouldScrollToBottom: shouldScrollToBottom.current,
      scrollAttempts: scrollAttempts.current,
      containerDimensions: {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        scrollTop: container.scrollTop
      },
      timestamp: new Date().toISOString()
    });

    lastMessageCount.current = messages.length;
    
    if (shouldForceScroll && messageCountChanged) {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollAttempts.current++;
      const scrollDelay = isInitialLoad.current ? 50 : 100;

      logger.debug(LogCategory.STATE, 'ScrollManager', 'Scheduling scroll', {
        delay: scrollDelay,
        isInitialLoad: isInitialLoad.current,
        messageCount: messages.length,
        scrollAttempts: scrollAttempts.current,
        timestamp: new Date().toISOString()
      });

      scrollTimeout.current = setTimeout(() => {
        const targetScroll = container.scrollHeight - container.clientHeight;
        
        logger.debug(LogCategory.STATE, 'ScrollManager', 'Executing scroll', {
          targetScroll,
          currentScroll: container.scrollTop,
          isInitialLoad: isInitialLoad.current,
          behavior: isInitialLoad.current ? 'auto' : 'smooth',
          scrollAttempts: scrollAttempts.current,
          containerDimensions: {
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
            scrollTop: container.scrollTop
          },
          timestamp: new Date().toISOString()
        });

        queueScroll({
          targetScroll,
          behavior: isInitialLoad.current ? 'auto' : 'smooth',
          timestamp: performance.now()
        });
        
        processQueue(container, { logMetrics, measureOperation });
        
        if (isInitialLoad.current) {
          logger.debug(LogCategory.STATE, 'ScrollManager', 'Initial load complete', {
            scrollAttempts: scrollAttempts.current,
            timestamp: new Date().toISOString()
          });
          isInitialLoad.current = false;
        }
      }, scrollDelay);
    }

    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [messages, containerRef, isLoading, isMounted, processQueue, queueScroll, logMetrics, measureOperation]);

  return {
    isNearBottom: shouldScrollToBottom.current,
    metrics: {
      logMetrics,
      measureOperation
    }
  };
};