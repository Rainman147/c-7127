export enum LogCategory {
  STATE = 'state',
  RENDER = 'render',
  COMMUNICATION = 'communication',
  ERROR = 'error',
  ROUTING = 'routing',
  DATABASE = 'database',
  PERFORMANCE = 'performance',
  VALIDATION = 'validation',
  WEBSOCKET = 'websocket',
  CACHE = 'cache',
  LIFECYCLE = 'lifecycle',
  COMPONENT = 'component',
  USER_ACTION = 'user_action',
  METRICS = 'metrics'  // Added this new category
}

interface LogMetadata {
  timestamp: string;
  retryCount?: number;
  connectionState?: string;
  duration?: number;
  [key: string]: any;
}

export const logger = {
  debug: (category: LogCategory, component: string, message: string, data?: any) => {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      ...data
    };
    console.debug(`[${category}] [${component}] ${message}`, metadata);
  },
  info: (category: LogCategory, component: string, message: string, data?: any) => {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      ...data
    };
    console.log(`[${category}] [${component}] ${message}`, metadata);
  },
  warn: (category: LogCategory, component: string, message: string, data?: any) => {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      ...data
    };
    console.warn(`[${category}] [${component}] ${message}`, metadata);
  },
  error: (category: LogCategory, component: string, message: string, data?: any) => {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      ...data
    };
    console.error(`[${category}] [${component}] ${message}`, metadata);
  },
  performance: (component: string, operation: string, duration: number, data?: any) => {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      duration,
      ...data
    };
    console.log(`[${LogCategory.PERFORMANCE}] [${component}] ${operation}`, metadata);
  }
};

// Performance tracking utility
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

// WebSocket specific logging
export const wsLogger = {
  connectionStateChange: (component: string, from: string, to: string, metadata?: any) => {
    logger.info(LogCategory.WEBSOCKET, component, 'Connection state changed', {
      from,
      to,
      ...metadata
    });
  },
  messageAttempt: (component: string, messageId: string, metadata?: any) => {
    logger.debug(LogCategory.WEBSOCKET, component, 'Message submission attempt', {
      messageId,
      ...metadata
    });
  },
  messageOutcome: (component: string, messageId: string, success: boolean, metadata?: any) => {
    logger.info(LogCategory.WEBSOCKET, component, `Message ${success ? 'sent' : 'failed'}`, {
      messageId,
      success,
      ...metadata
    });
  }
};

// Cache specific logging
export const cacheLogger = {
  queryExecution: (component: string, queryKey: unknown[], metadata?: any) => {
    logger.debug(LogCategory.CACHE, component, 'Query execution', {
      queryKey,
      ...metadata
    });
  },
  cacheInvalidation: (component: string, queryKey: unknown[], reason: string, metadata?: any) => {
    logger.info(LogCategory.CACHE, component, 'Cache invalidation', {
      queryKey,
      reason,
      ...metadata
    });
  },
  cacheHit: (component: string, queryKey: unknown[], metadata?: any) => {
    logger.debug(LogCategory.CACHE, component, 'Cache hit', {
      queryKey,
      ...metadata
    });
  }
};
