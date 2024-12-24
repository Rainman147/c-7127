import { useRef, RefObject, useEffect } from 'react';
import { useScrollMetrics } from './ScrollManagerMetrics';
import { useScrollQueue } from './scroll/useScrollQueue';
import { useScrollPosition } from './scroll/useScrollPosition';
import { ScrollLogger } from './scroll/ScrollLogger';
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
  const shouldScrollToBottom = useRef<boolean>(true);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const isInitialLoad = useRef<boolean>(true);
  const lastMessageCount = useRef<number>(0);
  const scrollAttempts = useRef<number>(0);
  const { logMetrics, measureOperation } = useScrollMetrics(containerRef);
  const { processQueue, queueScroll } = useScrollQueue();

  const handleScroll = (currentPosition: number, maxScroll: number) => {
    const isNearBottom = maxScroll - currentPosition < 100;
    shouldScrollToBottom.current = isNearBottom;
  };

  useScrollPosition(containerRef, isMounted, handleScroll);

  useEffect(() => {
    const container = containerRef.current;
    
    if (!container || isLoading || !isMounted) {
      ScrollLogger.containerInit(container, isMounted);
      return;
    }

    ScrollLogger.messageUpdate(messages, isLoading, isMounted);

    const messageCountChanged = messages.length !== lastMessageCount.current;
    const shouldForceScroll = isInitialLoad.current || shouldScrollToBottom.current;
    
    lastMessageCount.current = messages.length;
    
    if (shouldForceScroll && messageCountChanged) {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollAttempts.current++;
      const scrollDelay = isInitialLoad.current ? 50 : 100;

      scrollTimeout.current = setTimeout(() => {
        const targetScroll = container.scrollHeight - container.clientHeight;
        const scrollStartTime = performance.now();
        
        queueScroll({
          targetScroll,
          behavior: isInitialLoad.current ? 'auto' : 'smooth',
          timestamp: performance.now()
        });
        
        processQueue(container, { 
          logMetrics, 
          measureOperation,
          onComplete: () => {
            ScrollLogger.scrollComplete(container, targetScroll, scrollStartTime);
          }
        });
        
        if (isInitialLoad.current) {
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