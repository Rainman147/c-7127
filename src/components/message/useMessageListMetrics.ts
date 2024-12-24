import { useRef, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useScrollMetrics } from './ScrollManagerMetrics';

export const useMessageListMetrics = (
  containerRef: React.RefObject<HTMLDivElement>,
  isMounted: boolean,
  keyboardVisible: boolean
) => {
  const renderStartTime = useRef(performance.now());
  const metrics = useScrollMetrics(containerRef);

  // Monitor container dimensions with cleanup
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMounted) {
      logger.debug(LogCategory.STATE, 'MessageList', 'Container not ready for dimension monitoring', {
        isMounted,
        hasContainer: !!container,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        metrics.logMetrics('Container dimensions updated', {
          dimensions: entry.contentRect,
          keyboardVisible
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [isMounted, keyboardVisible, metrics]);

  return {
    renderStartTime,
    metrics
  };
};