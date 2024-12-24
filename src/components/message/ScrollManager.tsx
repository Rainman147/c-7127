import { useRef, RefObject } from 'react';
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
  const { logMetrics, measureOperation } = useScrollMetrics(containerRef);
  const { processQueue, queueScroll } = useScrollQueue();

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
      timestamp: new Date().toISOString()
    });
    
    lastScrollPosition.current = currentPosition;
  };

  useScrollDimensions(containerRef, isMounted, handleScroll);

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
      timestamp: new Date().toISOString()
    });

    lastMessageCount.current = messages.length;
    
    if (shouldForceScroll) {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        const targetScroll = container.scrollHeight - container.clientHeight;
        
        queueScroll({
          targetScroll,
          behavior: isInitialLoad.current ? 'auto' : 'smooth',
          timestamp: performance.now()
        });
        
        processQueue(container, { logMetrics, measureOperation });
        
        isInitialLoad.current = false;
      }, isInitialLoad.current ? 0 : 100);
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