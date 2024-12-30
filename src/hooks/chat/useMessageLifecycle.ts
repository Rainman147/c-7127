import { useState, useCallback } from 'react';
import { transactionManager } from '@/utils/transactionManager';
import type { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

export const useMessageLifecycle = (sessionId: string | null) => {
  const [processingMessages, setProcessingMessages] = useState<Set<string>>(new Set());

  const trackMessageStart = useCallback((message: Message) => {
    const transaction = transactionManager.createTransaction(message.id);
    
    setProcessingMessages(prev => {
      const updated = new Set(prev);
      updated.add(message.id);
      return updated;
    });

    logger.info(LogCategory.STATE, 'MessageLifecycle', 'Message processing started:', {
      messageId: message.id,
      transactionId: transaction.id,
      sessionId,
      timestamp: new Date().toISOString()
    });

    return transaction.id;
  }, [sessionId]);

  const trackMessageComplete = useCallback((messageId: string, success: boolean, error?: string) => {
    const transaction = transactionManager.getTransactionByMessageId(messageId);
    
    if (transaction) {
      transactionManager.updateTransactionState(
        transaction.id,
        success ? 'confirmed' : 'failed',
        error
      );
    }

    setProcessingMessages(prev => {
      const updated = new Set(prev);
      updated.delete(messageId);
      return updated;
    });

    logger.info(LogCategory.STATE, 'MessageLifecycle', 'Message processing completed:', {
      messageId,
      transactionId: transaction?.id,
      success,
      error,
      sessionId,
      timestamp: new Date().toISOString()
    });
  }, [sessionId]);

  const isProcessing = useCallback((messageId: string) => {
    return processingMessages.has(messageId);
  }, [processingMessages]);

  return {
    trackMessageStart,
    trackMessageComplete,
    isProcessing,
    processingCount: processingMessages.size
  };
};