export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export enum LogCategory {
  RENDER = 'render',
  STATE = 'state',
  COMMUNICATION = 'communication',
  ERROR = 'error'
}

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  component?: string;
  message: string;
  data?: any;
};

const LOG_LEVEL = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;

export const logger = {
  debug: (category: LogCategory, component: string, message: string, data?: any) => {
    if (LOG_LEVEL <= LogLevel.DEBUG) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        category,
        component,
        message,
        data
      };
      console.debug(`[${entry.component}] ${entry.message}`, data || '');
    }
  },

  info: (category: LogCategory, component: string, message: string, data?: any) => {
    if (LOG_LEVEL <= LogLevel.INFO) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        category,
        component,
        message,
        data
      };
      console.log(`[${entry.component}] ${entry.message}`, data || '');
    }
  },

  warn: (category: LogCategory, component: string, message: string, data?: any) => {
    if (LOG_LEVEL <= LogLevel.WARN) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.WARN,
        category,
        component,
        message,
        data
      };
      console.warn(`[${entry.component}] ${entry.message}`, data || '');
    }
  },

  error: (category: LogCategory, component: string, message: string, data?: any) => {
    if (LOG_LEVEL <= LogLevel.ERROR) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.ERROR,
        category,
        component,
        message,
        data
      };
      console.error(`[${entry.component}] ${entry.message}`, data || '');
    }
  }
};