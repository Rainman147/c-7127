export enum LogCategory {
  RENDER = 'render',
  STATE = 'state',
  WEBSOCKET = 'websocket',
  ERROR = 'error',
  METRICS = 'metrics',
  COMMUNICATION = 'communication',
  AUTH = 'auth',
  SUBSCRIPTION = 'subscription',
  PERFORMANCE = 'performance',
  CACHE = 'cache',
  DATABASE = 'database',
  VALIDATION = 'validation',
  USER_ACTION = 'user_action',
  ROUTING = 'routing',
  LIFECYCLE = 'lifecycle'
}

export interface LogMetadata {
  timestamp: string;
  [key: string]: any;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';