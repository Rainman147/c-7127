export interface QueuedMessage {
  id: string;
  content: string;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'failed' | 'completed';
  metadata?: {
    connectionState?: string;
    lastError?: string;
    processingAttempts?: number[];
  };
}

export interface QueueStatus {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  totalMessages: number;
  oldestMessage: number | null;
  averageProcessingTime: number | null;
}