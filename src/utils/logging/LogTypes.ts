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
  METRICS = 'metrics'
}

export interface LogMetadata {
  timestamp: string;
  retryCount?: number;
  connectionState?: string;
  duration?: number;
  [key: string]: any;
}