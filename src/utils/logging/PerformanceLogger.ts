import { logger } from './LoggerCore';

export const measurePerformance = async <T>(
  component: string,
  operation: string,
  fn: () => Promise<T>,
  additionalData?: any
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.performance(component, operation, duration, {
      success: true,
      ...additionalData
    });
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.performance(component, operation, duration, {
      success: false,
      error,
      ...additionalData
    });
    throw error;
  }
};