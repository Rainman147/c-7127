import { useEffect, useRef, RefObject } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

interface ScrollManagerProps {
  containerRef: RefObject<HTMLDivElement>;
  messages: Message[];
  isLoading: boolean;
  isMounted: boolean;
}

interface QueuedScroll {
  targetScroll: number;
  behavior: ScrollBehavior;
  timestamp: number;
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
  const scrollQueue = useRef<QueuedScroll[]>([]);
  const processingQueue = useRef<boolean>(false);

  // Process queued scroll operations with retry logic
  const processScrollQueue = async () => {
    if (processingQueue.current || !isMounted) return;
    
    const container = containerRef.current;
    if (!container || scrollQueue.current.length === 0) {
      logger.debug(LogCategory.STATE, 'ScrollManager', 'Skip queue processing', {
        reason: !container ? 'No container' : 'Empty queue',
        timestamp: new Date().toISOString()
      });
      return;
    }

    processingQueue.current = true;
    const startTime = performance.now();

    try {
      while (scrollQueue.current.length > 0) {
        const nextScroll = scrollQueue.current[0];
        
        container.scrollTo({
          top: nextScroll.targetScroll,
          behavior: nextScroll.behavior
        });

        // Wait for scroll to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        logger.debug(LogCategory.STATE, 'ScrollManager', 'Processed scroll operation', {
          targetScroll: nextScroll.targetScroll,
          actualScroll: container.scrollTop,
          behavior: nextScroll.behavior,
          queueAge: performance.now() - nextScroll.timestamp,
          remainingQueue: scrollQueue.current.length - 1,
          timestamp: new Date().toISOString()
        });

        scrollQueue.current.shift();
      }
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ScrollManager', 'Failed to process scroll queue', {
        error,
        queueLength: scrollQueue.current.length,
        timestamp: new Date().toISOString()
      });
    } finally {
      processingQueue.current = false;
      logger.debug(LogCategory.STATE, 'ScrollManager', 'Queue processing complete', {
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Track container dimensions and scroll state
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMounted) {
      logger.debug(LogCategory.STATE, 'ScrollManager', 'Container not ready for scroll tracking', {
        isMounted,
        hasContainer: !!container,
        timestamp: new Date().toISOString()
      });
      return;
    }

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
        hasScrollbar: container.scrollHeight > container.clientHeight,
        timestamp: new Date().toISOString()
      });
      
      lastScrollPosition.current = currentPosition;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, messages.length, isMounted]);

  // Handle messages updates and scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isLoading || !isMounted) return;

    const messageCountChanged = messages.length !== lastMessageCount.current;
    const shouldForceScroll = isInitialLoad.current || shouldScrollToBottom.current;
    
    logger.debug(LogCategory.STATE, 'ScrollManager', 'Messages updated', {
      previousCount: lastMessageCount.current,
      newCount: messages.length,
      messageCountChanged,
      shouldForceScroll,
      isInitialLoad: isInitialLoad.current,
      containerHeight: container.clientHeight,
      scrollHeight: container.scrollHeight,
      hasScrollbar: container.scrollHeight > container.clientHeight,
      timestamp: new Date().toISOString()
    });

    lastMessageCount.current = messages.length;
    
    if (shouldForceScroll) {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        const scrollStartTime = performance.now();
        const targetScroll = container.scrollHeight - container.clientHeight;
        
        // Queue the scroll operation
        scrollQueue.current.push({
          targetScroll,
          behavior: isInitialLoad.current ? 'auto' : 'smooth',
          timestamp: performance.now()
        });
        
        processScrollQueue();
        
        logger.debug(LogCategory.STATE, 'ScrollManager', 'Scroll operation queued', {
          duration: performance.now() - scrollStartTime,
          targetScroll,
          isInitialLoad: isInitialLoad.current,
          queueLength: scrollQueue.current.length,
          timestamp: new Date().toISOString()
        });

        isInitialLoad.current = false;
      }, isInitialLoad.current ? 0 : 100);
    }

    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [messages, containerRef, isLoading, isMounted]);

  return {
    isNearBottom: shouldScrollToBottom.current
  };
};