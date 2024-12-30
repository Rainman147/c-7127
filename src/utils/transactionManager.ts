import { v4 as uuidv4 } from 'uuid';
import type { MessageTransaction, TransactionState } from '@/types/messageTransaction';
import { logger, LogCategory } from '@/utils/logging';

class TransactionManager {
  private transactions: Map<string, MessageTransaction> = new Map();

  createTransaction(messageId: string): MessageTransaction {
    const transaction: MessageTransaction = {
      id: uuidv4(),
      messageId,
      state: 'initiated',
      timestamp: Date.now(),
      retryCount: 0
    };

    this.transactions.set(transaction.id, transaction);
    
    logger.info(LogCategory.STATE, 'TransactionManager', 'Transaction created:', {
      transactionId: transaction.id,
      messageId,
      state: transaction.state,
      timestamp: new Date(transaction.timestamp).toISOString()
    });

    return transaction;
  }

  updateTransactionState(
    transactionId: string, 
    newState: TransactionState, 
    error?: string
  ): MessageTransaction | null {
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      logger.error(LogCategory.STATE, 'TransactionManager', 'Transaction not found:', {
        transactionId,
        newState,
        error
      });
      return null;
    }

    const updatedTransaction = {
      ...transaction,
      state: newState,
      timestamp: Date.now(),
      error: error,
      retryCount: newState === 'retrying' ? transaction.retryCount + 1 : transaction.retryCount
    };

    this.transactions.set(transactionId, updatedTransaction);

    logger.info(LogCategory.STATE, 'TransactionManager', 'Transaction updated:', {
      transactionId,
      messageId: transaction.messageId,
      previousState: transaction.state,
      newState,
      retryCount: updatedTransaction.retryCount,
      error,
      timestamp: new Date(updatedTransaction.timestamp).toISOString()
    });

    return updatedTransaction;
  }

  getTransaction(transactionId: string): MessageTransaction | null {
    return this.transactions.get(transactionId) || null;
  }

  getTransactionByMessageId(messageId: string): MessageTransaction | null {
    return Array.from(this.transactions.values())
      .find(t => t.messageId === messageId) || null;
  }

  removeTransaction(transactionId: string): void {
    const transaction = this.transactions.get(transactionId);
    if (transaction) {
      this.transactions.delete(transactionId);
      logger.info(LogCategory.STATE, 'TransactionManager', 'Transaction removed:', {
        transactionId,
        messageId: transaction.messageId,
        finalState: transaction.state,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const transactionManager = new TransactionManager();