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
  const lastProcessTime = useRef<number>(0);

  const processQueue = async (container: HTMLDivElement, metrics: any) => {
    if (processingQueue.current) {
      logger.debug(LogCategory.STATE, 'ScrollQueue', 'Queue processing already in progress', {
        queueLength: scrollQueue.current.length,
        timestamp: new Date().toISOString(),
        timeSinceLastProcess: Date.now() - lastProcessTime.current,
        route: window.location.pathname
      });
      return;
    }
    
    if (scrollQueue.current.length === 0) {
      logger.debug(LogCategory.STATE, 'ScrollQueue', 'Skip queue processing - Empty queue', {
        timestamp: new Date().toISOString(),
        route: window.location.pathname
      });
      return;
    }

    processingQueue.current = true;
    const processStartTime = Date.now();
    const performance = metrics.measureOperation('Queue processing');

    logger.debug(LogCategory.STATE, 'ScrollQueue', 'Starting queue processing', {
      queueLength: scrollQueue.current.length,
      containerDimensions: {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        scrollTop: container.scrollTop
      },
      timestamp: new Date().toISOString(),
      route: window.location.pathname
    });

    try {
      while (scrollQueue.current.length > 0) {
        const nextScroll = scrollQueue.current[0];
        const scrollStartTime = performance.now();
        const scrollPerformance = metrics.measureOperation('Individual scroll');
        
        logger.debug(LogCategory.STATE, 'ScrollQueue', 'Processing scroll operation', {
          targetScroll: nextScroll.targetScroll,
          currentScroll: container.scrollTop,
          behavior: nextScroll.behavior,
          queueAge: performance.now() - nextScroll.timestamp,
          timestamp: new Date().toISOString(),
          route: window.location.pathname
        });
        
        container.scrollTo({
          top: nextScroll.targetScroll,
          behavior: nextScroll.behavior
        });

        await new Promise(resolve => setTimeout(resolve, 100));
        
        const scrollEndPosition = container.scrollTop;
        const scrollSuccess = Math.abs(scrollEndPosition - nextScroll.targetScroll) < 1;
        
        metrics.logMetrics('Scroll operation complete', {
          targetScroll: nextScroll.targetScroll,
          actualScroll: scrollEndPosition,
          scrollDelta: scrollEndPosition - container.scrollTop,
          behavior: nextScroll.behavior,
          duration: performance.now() - scrollStartTime,
          success: scrollSuccess,
          queueAge: performance.now() - nextScroll.timestamp
        });
        
        scrollPerformance.end();
        scrollQueue.current.shift();
        
        logger.debug(LogCategory.STATE, 'ScrollQueue', 'Scroll operation completed', {
          success: scrollSuccess,
          duration: performance.now() - scrollStartTime,
          remainingQueue: scrollQueue.current.length,
          timestamp: new Date().toISOString(),
          route: window.location.pathname
        });
      }
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ScrollQueue', 'Failed to process scroll queue', {
        error,
        queueLength: scrollQueue.current.length,
        timestamp: new Date().toISOString(),
        route: window.location.pathname
      });
    } finally {
      processingQueue.current = false;
      lastProcessTime.current = Date.now();
      const totalDuration = Date.now() - processStartTime;
      performance.end();
      
      logger.debug(LogCategory.STATE, 'ScrollQueue', 'Queue processing completed', {
        duration: totalDuration,
        timestamp: new Date().toISOString(),
        route: window.location.pathname
      });
    }
  };

  const queueScroll = (scroll: QueuedScroll) => {
    scrollQueue.current.push(scroll);
    logger.debug(LogCategory.STATE, 'ScrollQueue', 'Scroll operation queued', {
      queueLength: scrollQueue.current.length,
      scroll,
      timestamp: new Date().toISOString(),
      route: window.location.pathname
    });
  };

  return {
    processQueue,
    queueScroll,
    scrollQueue
  };
};