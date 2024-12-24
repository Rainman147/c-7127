import { logger, LogCategory } from './logging';

export const logScrollMetrics = (
  container: HTMLDivElement,
  event: string,
  additionalData?: Record<string, any>
) => {
  const metrics = {
    scrollHeight: container.scrollHeight,
    clientHeight: container.clientHeight,
    scrollTop: container.scrollTop,
    hasScrollbar: container.scrollHeight > container.clientHeight,
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  logger.debug(LogCategory.STATE, 'ScrollMetrics', `${event}:`, metrics);
  return metrics;
};

export const measureScrollPerformance = (operation: string) => {
  const start = performance.now();
  return {
    end: () => {
      const duration = performance.now() - start;
      logger.debug(LogCategory.STATE, 'ScrollPerformance', `${operation} completed:`, {
        duration,
        timestamp: new Date().toISOString()
      });
      return duration;
    }
  };
};