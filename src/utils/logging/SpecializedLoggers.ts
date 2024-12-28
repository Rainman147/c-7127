import { logger, LogCategory } from './LoggerCore';

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