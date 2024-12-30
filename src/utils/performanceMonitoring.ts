import { logger, LogCategory } from './logging';

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  operation: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  startOperation(operationId: string, operation: string, metadata?: Record<string, any>) {
    const startTime = performance.now();
    this.metrics.set(operationId, {
      startTime,
      operation,
      metadata
    });

    logger.debug(LogCategory.PERFORMANCE, 'PerformanceMonitor', 'Operation started:', {
      operationId,
      operation,
      startTime,
      metadata
    });
  }

  endOperation(operationId: string, additionalMetadata?: Record<string, any>) {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      logger.warn(LogCategory.PERFORMANCE, 'PerformanceMonitor', 'No matching operation found:', {
        operationId
      });
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const updatedMetric = {
      ...metric,
      endTime,
      duration,
      metadata: {
        ...metric.metadata,
        ...additionalMetadata
      }
    };

    this.metrics.set(operationId, updatedMetric);

    logger.info(LogCategory.PERFORMANCE, 'PerformanceMonitor', 'Operation completed:', {
      operationId,
      operation: metric.operation,
      duration: `${duration.toFixed(2)}ms`,
      metadata: updatedMetric.metadata
    });

    return duration;
  }

  getMetrics(operationId: string) {
    return this.metrics.get(operationId);
  }

  clearMetrics(operationId: string) {
    this.metrics.delete(operationId);
  }
}

export const performanceMonitor = new PerformanceMonitor();