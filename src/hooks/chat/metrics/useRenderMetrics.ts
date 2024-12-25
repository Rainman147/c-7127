import { useRef, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { RenderMetrics } from './types';

const RENDER_TIME_THRESHOLD = 16.67; // ms (targeting 60fps)

export const useRenderMetrics = (messageCount: number, groupCount: number) => {
  const renderStartTime = useRef(performance.now());
  const lastRenderTime = useRef(performance.now());
  const renderCount = useRef(0);
  const cleanupCount = useRef(0);

  const calculateMetrics = useCallback((): RenderMetrics => {
    return {
      renderTime: performance.now() - renderStartTime.current,
      messageCount,
      groupCount,
      averageRenderTime: renderCount.current > 0 
        ? (performance.now() - renderStartTime.current) / renderCount.current 
        : 0,
      timestamp: new Date().toISOString()
    };
  }, [messageCount, groupCount]);

  const monitorRender = useCallback(() => {
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    renderCount.current += 1;

    if (timeSinceLastRender > RENDER_TIME_THRESHOLD) {
      logger.warn(LogCategory.PERFORMANCE, 'RenderMetrics', 'Render time exceeded threshold', {
        renderTime: `${timeSinceLastRender.toFixed(2)}ms`,
        threshold: `${RENDER_TIME_THRESHOLD}ms`,
        messageCount,
        groupCount,
        renderCount: renderCount.current,
        totalRuntime: `${(currentTime - renderStartTime.current).toFixed(2)}ms`,
        timePerMessage: messageCount > 0 ? timeSinceLastRender / messageCount : 0,
        cleanupCount: cleanupCount.current
      });
    }

    lastRenderTime.current = currentTime;
    return calculateMetrics();
  }, [messageCount, groupCount, calculateMetrics]);

  const logCleanup = useCallback(() => {
    cleanupCount.current += 1;
    logger.info(LogCategory.PERFORMANCE, 'RenderMetrics', 'Component cleanup', {
      cleanupCount: cleanupCount.current,
      totalLifetime: performance.now() - renderStartTime.current,
      messageMetrics: {
        finalMessageCount: messageCount,
        averageRenderTime: calculateMetrics().averageRenderTime
      }
    });
  }, [messageCount, calculateMetrics]);

  return { monitorRender, logCleanup };
};