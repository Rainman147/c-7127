export type TransactionState = 
  | 'initiated'    // Message creation started
  | 'pending'      // Optimistic update applied
  | 'processing'   // Server processing
  | 'confirmed'    // Server confirmed
  | 'failed'       // Transaction failed
  | 'retrying';    // Retry attempt

export interface MessageTransaction {
  id: string;
  messageId: string;
  state: TransactionState;
  timestamp: number;
  retryCount: number;
  error?: string;
}

export interface TransactionMetadata {
  transactionId: string;
  initiatedAt: number;
  lastUpdated: number;
  transitions: {
    state: TransactionState;
    timestamp: number;
  }[];
}