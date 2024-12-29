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
  ERROR = 'error',
  DATABASE = 'database',
  LIFECYCLE = 'lifecycle',  // Added this category
  HOOKS = 'hooks'          // Added this category
}

// Add type definition for Chrome's non-standard Performance interface
interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// Helper function to safely get memory info
const getMemoryInfo = () => {
  const performance = window.performance as ExtendedPerformance;
  return performance?.memory ? {
    usedJSHeapSize: performance.memory.usedJSHeapSize,
    totalJSHeapSize: performance.memory.totalJSHeapSize,
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
  } : 'Not available';
};

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
        data: data ? {
          ...data,
          performance: data.performance ? {
            ...data.performance,
            memory: getMemoryInfo()
          } : undefined
        } : undefined
      };
      console.debug(`[${entry.component}] ${entry.message}`, entry.data || '');
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
        data: data ? {
          ...data,
          performance: data.performance ? {
            ...data.performance,
            memory: getMemoryInfo()
          } : undefined
        } : undefined
      };
      console.log(`[${entry.component}] ${entry.message}`, entry.data || '');
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
        data: data ? {
          ...data,
          performance: data.performance ? {
            ...data.performance,
            memory: getMemoryInfo()
          } : undefined
        } : undefined
      };
      console.warn(`[${entry.component}] ${entry.message}`, entry.data || '');
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
        data: data ? {
          ...data,
          performance: data.performance ? {
            ...data.performance,
            memory: getMemoryInfo()
          } : undefined
        } : undefined
      };
      console.error(`[${entry.component}] ${entry.message}`, entry.data || '');
    }
  }
};