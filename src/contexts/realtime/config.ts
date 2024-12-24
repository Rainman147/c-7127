export const retryConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: 5,
  backoffFactor: 1.5,
};

export const getNextRetryDelay = (attempt: number): number => {
  const delay = retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, attempt);
  return Math.min(delay, retryConfig.maxDelay);
};

export type ConnectionState = {
  status: 'connected' | 'connecting' | 'disconnected';
  lastAttempt: number;
  retryCount: number;
  error?: Error;
};

export type RealTimeContextValue = {
  connectionState: ConnectionState;
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  activeSubscriptions: Set<string>;
  lastMessage?: Message;
};