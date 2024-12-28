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
  METRICS = 'metrics',
  AUTH = 'auth',
  SUBSCRIPTION = 'subscription'
}

export interface LogMetadata {
  timestamp: string;
  retryCount?: number;
  connectionState?: string;
  duration?: number;
  componentId?: string;
  sessionId?: string;
  messageId?: string;
  error?: Error;
  [key: string]: any;
}

export interface WebSocketLogMetadata extends LogMetadata {
  channelId?: string;
  eventType?: string;
  subscriptionStatus?: string;
  payloadSize?: number;
}

export interface QueueLogMetadata extends LogMetadata {
  queueSize: number;
  messageContent?: string;
  processingTime?: number;
}
