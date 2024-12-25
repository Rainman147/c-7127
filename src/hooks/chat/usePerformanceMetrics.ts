import { useEffect } from 'react';
import { useMemoryMetrics } from './metrics/useMemoryMetrics';
import { useRenderMetrics } from './metrics/useRenderMetrics';

const MEMORY_SNAPSHOT_INTERVAL = 10000; // 10 seconds

export const usePerformanceMetrics = (messageCount: number, groupCount: number) => {
  const { monitorMemory } = useMemoryMetrics(messageCount);
  const { monitorRender, logCleanup } = useRenderMetrics(messageCount, groupCount);

  useEffect(() => {
    const metrics = monitorRender();
    const intervalId = setInterval(monitorMemory, MEMORY_SNAPSHOT_INTERVAL);

    return () => {
      clearInterval(intervalId);
      logCleanup();
    };
  }, [monitorRender, monitorMemory, logCleanup]);

  return {
    metrics: monitorRender(),
    renderCount: 0 // This was unused in the original implementation
  };
};