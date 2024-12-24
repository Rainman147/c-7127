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
  const lastScrollTime = useRef<number>(Date.now());
  const { logMetrics, measureOperation } = useScrollMetrics(containerRef);
  const { processQueue, queueScroll } = useScrollQueue();

  // Log initial state
  useEffect(() => {
    logger.debug(LogCategory.STATE, 'ScrollManager', 'Initial state', {
      timestamp: new Date().toISOString(),
      isInitialLoad: isInitialLoad.current,
      shouldScrollToBottom: shouldScrollToBottom.current,
      messageCount: messages.length,
      lastMessageCount: lastMessageCount.current,
      scrollAttempts: scrollAttempts.current,
      isMounted,
      isLoading,
      route: window.location.pathname
    });
  }, []);

  // Enhanced scroll position tracking
  const handleScroll = (currentPosition: number, maxScroll: number) => {
    const scrollDelta = currentPosition - lastScrollPosition.current;
    const isNearBottom = maxScroll - currentPosition < 100;
    const scrollTime = Date.now();
    const timeSinceLastScroll = scrollTime - lastScrollTime.current;
    
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
      timeSinceLastScroll,
      containerDimensions: containerRef.current ? {
        scrollHeight: containerRef.current.scrollHeight,
        clientHeight: containerRef.current.clientHeight,
        scrollTop: containerRef.current.scrollTop,
        offsetHeight: containerRef.current.offsetHeight,
        scrollRatio: containerRef.current.scrollTop / containerRef.current.scrollHeight
      } : null,
      timestamp: new Date().toISOString(),
      route: window.location.pathname
    });
    
    lastScrollPosition.current = currentPosition;
    lastScrollTime.current = scrollTime;
  };

  useScrollDimensions(containerRef, isMounted, handleScroll);

  // Enhanced message updates and scrolling tracking
  useEffect(() => {
    const container = containerRef.current;
    const startTime = performance.now();
    
    if (!container || isLoading || !isMounted) {
      logger.debug(LogCategory.STATE, 'ScrollManager', 'Skipping scroll update', {
        hasContainer: !!container,
        containerDimensions: container ? {
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          scrollTop: container.scrollTop,
          offsetHeight: container.offsetHeight,
          scrollRatio: container?.scrollTop / container?.scrollHeight
        } : null,
        isLoading,
        isMounted,
        messageCount: messages.length,
        lastMessageCount: lastMessageCount.current,
        isInitialLoad: isInitialLoad.current,
        shouldScrollToBottom: shouldScrollToBottom.current,
        scrollAttempts: scrollAttempts.current,
        timestamp: new Date().toISOString(),
        route: window.location.pathname
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
      processingTime: performance.now() - startTime,
      containerDimensions: {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        scrollTop: container.scrollTop,
        offsetHeight: container.offsetHeight,
        scrollRatio: container.scrollTop / container.scrollHeight
      },
      timestamp: new Date().toISOString(),
      route: window.location.pathname
    });

    lastMessageCount.current = messages.length;
    
    if (shouldForceScroll && messageCountChanged) {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
        logger.debug(LogCategory.STATE, 'ScrollManager', 'Cleared existing scroll timeout', {
          timestamp: new Date().toISOString(),
          route: window.location.pathname
        });
      }

      scrollAttempts.current++;
      const scrollDelay = isInitialLoad.current ? 50 : 100;

      logger.debug(LogCategory.STATE, 'ScrollManager', 'Scheduling scroll', {
        delay: scrollDelay,
        isInitialLoad: isInitialLoad.current,
        messageCount: messages.length,
        scrollAttempts: scrollAttempts.current,
        timestamp: new Date().toISOString(),
        route: window.location.pathname
      });

      scrollTimeout.current = setTimeout(() => {
        const targetScroll = container.scrollHeight - container.clientHeight;
        const scrollStartTime = performance.now();
        
        logger.debug(LogCategory.STATE, 'ScrollManager', 'Executing scroll', {
          targetScroll,
          currentScroll: container.scrollTop,
          isInitialLoad: isInitialLoad.current,
          behavior: isInitialLoad.current ? 'auto' : 'smooth',
          scrollAttempts: scrollAttempts.current,
          timeSinceUpdate: performance.now() - startTime,
          containerDimensions: {
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
            scrollTop: container.scrollTop,
            offsetHeight: container.offsetHeight,
            scrollRatio: container.scrollTop / container.scrollHeight
          },
          timestamp: new Date().toISOString(),
          route: window.location.pathname
        });

        queueScroll({
          targetScroll,
          behavior: isInitialLoad.current ? 'auto' : 'smooth',
          timestamp: performance.now()
        });
        
        processQueue(container, { 
          logMetrics, 
          measureOperation,
          onComplete: () => {
            logger.debug(LogCategory.STATE, 'ScrollManager', 'Scroll operation complete', {
              duration: performance.now() - scrollStartTime,
              finalPosition: container.scrollTop,
              targetAchieved: Math.abs(container.scrollTop - targetScroll) < 1,
              timestamp: new Date().toISOString(),
              route: window.location.pathname
            });
          }
        });
        
        if (isInitialLoad.current) {
          logger.debug(LogCategory.STATE, 'ScrollManager', 'Initial load complete', {
            scrollAttempts: scrollAttempts.current,
            totalDuration: performance.now() - startTime,
            timestamp: new Date().toISOString(),
            route: window.location.pathname
          });
          isInitialLoad.current = false;
        }
      }, scrollDelay);
    }

    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
        logger.debug(LogCategory.STATE, 'ScrollManager', 'Cleanup: Cleared scroll timeout', {
          timestamp: new Date().toISOString(),
          route: window.location.pathname
        });
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