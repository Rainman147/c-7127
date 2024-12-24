import { useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';

interface QueuedScroll {
  targetScroll: number;
  behavior: ScrollBehavior;
  timestamp: number;
}

export const useScrollQueue = () => {
  const scrollQueue = useRef<QueuedScroll[]>([]);
  const processingQueue = useRef<boolean>(false);

  const processQueue = async (container: HTMLDivElement, metrics: any) => {
    if (processingQueue.current) return;
    
    if (scrollQueue.current.length === 0) {
      logger.debug(LogCategory.STATE, 'ScrollQueue', 'Skip queue processing - Empty queue', {
        timestamp: new Date().toISOString()
      });
      return;
    }

    processingQueue.current = true;
    const performance = metrics.measureOperation('Queue processing');

    try {
      while (scrollQueue.current.length > 0) {
        const nextScroll = scrollQueue.current[0];
        const scrollPerformance = metrics.measureOperation('Individual scroll');
        
        container.scrollTo({
          top: nextScroll.targetScroll,
          behavior: nextScroll.behavior
        });

        await new Promise(resolve => setTimeout(resolve, 100));
        metrics.logMetrics('Scroll operation complete', {
          targetScroll: nextScroll.targetScroll,
          actualScroll: container.scrollTop,
          behavior: nextScroll.behavior,
          queueAge: performance.now() - nextScroll.timestamp
        });
        
        scrollPerformance.end();
        scrollQueue.current.shift();
      }
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ScrollQueue', 'Failed to process scroll queue', {
        error,
        queueLength: scrollQueue.current.length,
        timestamp: new Date().toISOString()
      });
    } finally {
      processingQueue.current = false;
      performance.end();
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