export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  messageCount: number;
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usageRatio: number;
  heapLimitRatio: number;
  baselineUsage: number | null;
  memoryGrowth: number;
  memoryPerMessage: number;
}

export interface RenderMetrics {
  renderTime: number;
  messageCount: number;
  groupCount: number;
  averageRenderTime: number;
  timestamp: string;
}