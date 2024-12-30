import { logger, LogCategory } from './logging';
import type { Message } from '@/types/chat';
import type { MessageTransaction } from '@/types/messageTransaction';

class MessageLogger {
  private static instance: MessageLogger;
  
  private constructor() {}

  static getInstance(): MessageLogger {
    if (!this.instance) {
      this.instance = new MessageLogger();
    }
    return this.instance;
  }

  logTransactionStart(transaction: MessageTransaction, message: Message) {
    logger.info(LogCategory.STATE, 'MessageLogger', 'Transaction started:', {
      transactionId: transaction.id,
      messageId: message.id,
      state: transaction.state,
      timestamp: new Date().toISOString(),
      sequence: message.sequence,
      type: message.type
    });
  }

  logStateTransition(messageId: string, fromState: string, toState: string, isValid: boolean) {
    logger.info(LogCategory.STATE, 'MessageLogger', 'State transition:', {
      messageId,
      fromState,
      toState,
      isValid,
      timestamp: new Date().toISOString()
    });
  }

  logPerformanceMetric(operation: string, duration: number, metadata?: Record<string, any>) {
    logger.info(LogCategory.PERFORMANCE, 'MessageLogger', 'Performance metric:', {
      operation,
      duration: `${duration.toFixed(2)}ms`,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  logLoadingStateChange(state: string, isActive: boolean, metadata?: Record<string, any>) {
    logger.info(LogCategory.STATE, 'MessageLogger', 'Loading state changed:', {
      state,
      isActive,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  logQueueOperation(operation: string, queueLength: number, metadata?: Record<string, any>) {
    logger.info(LogCategory.STATE, 'MessageLogger', 'Queue operation:', {
      operation,
      queueLength,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  logError(category: string, error: Error, metadata?: Record<string, any>) {
    logger.error(LogCategory.ERROR, 'MessageLogger', `${category} error:`, {
      error: error.message,
      stack: error.stack,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  logRenderCycle(component: string, renderCount: number, duration: number) {
    logger.debug(LogCategory.RENDER, 'MessageLogger', 'Component render:', {
      component,
      renderCount,
      duration: `${duration.toFixed(2)}ms`,
      timestamp: new Date().toISOString(),
      memory: performance?.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize
      } : undefined
    });
  }
}

export const messageLogger = MessageLogger.getInstance();