import { useRef } from 'react';
import { ScrollLogger } from './ScrollLogger';

interface QueuedScroll {
  targetScroll: number;
  behavior: ScrollBehavior;
  timestamp: number;
}

export const useScrollQueue = () => {
  const scrollQueue = useRef<QueuedScroll[]>([]);
  const processingQueue = useRef<boolean>(false);
  const lastProcessTime = useRef<number>(0);

  const processQueue = async (container: HTMLDivElement, metrics: any) => {
    if (processingQueue.current || scrollQueue.current.length === 0) {
      return;
    }

    processingQueue.current = true;
    const processStartTime = Date.now();

    try {
      while (scrollQueue.current.length > 0) {
        const nextScroll = scrollQueue.current[0];
        const scrollStartTime = performance.now();
        
        ScrollLogger.scrollAttempt(container, nextScroll.targetScroll, nextScroll.behavior);
        
        container.scrollTo({
          top: nextScroll.targetScroll,
          behavior: nextScroll.behavior
        });

        await new Promise(resolve => setTimeout(resolve, 100));
        
        ScrollLogger.scrollComplete(container, nextScroll.targetScroll, scrollStartTime);
        
        scrollQueue.current.shift();
      }
    } finally {
      processingQueue.current = false;
      lastProcessTime.current = Date.now();
    }
  };

  const queueScroll = (scroll: QueuedScroll) => {
    scrollQueue.current.push(scroll);
  };

  return {
    processQueue,
    queueScroll,
    scrollQueue
  };
};