// Base error interface for all custom errors
export interface CustomError {
  name: ErrorType;
  message: string;
  timestamp: string;
  connectionState: string;
  retryCount: number;
  lastAttempt: number;
  backoffDelay: number;
  reason: string;
}

export type ErrorType = 'WebSocketError' | 'ChannelError' | 'ConnectionError';

export interface WebSocketError extends CustomError {
  name: 'WebSocketError';
}

export interface SubscriptionError extends CustomError {
  name: 'ChannelError';
  channelId: string;
  event: string;
}

export interface ConnectionError extends CustomError {
  name: 'ConnectionError';
  code: number;
}

// Type guard functions to help with type narrowing
export const isWebSocketError = (error: CustomError): error is WebSocketError => {
  return error.name === 'WebSocketError';
};

export const isSubscriptionError = (error: CustomError): error is SubscriptionError => {
  return error.name === 'ChannelError';
};

export const isConnectionError = (error: CustomError): error is ConnectionError => {
  return error.name === 'ConnectionError';
};