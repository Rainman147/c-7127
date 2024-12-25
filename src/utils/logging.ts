export enum LogCategory {
  STATE = 'state',
  RENDER = 'render',
  COMMUNICATION = 'communication',
  ERROR = 'error',
  ROUTING = 'routing',
  DATABASE = 'database',
  PERFORMANCE = 'performance',
  VALIDATION = 'validation'
}

export const logger = {
  debug: (category: LogCategory, component: string, message: string, data?: any) => {
    console.debug(`[${category}] [${component}] ${message}`, data || '');
  },
  info: (category: LogCategory, component: string, message: string, data?: any) => {
    console.log(`[${category}] [${component}] ${message}`, data || '');
  },
  warn: (category: LogCategory, component: string, message: string, data?: any) => {
    console.warn(`[${category}] [${component}] ${message}`, data || '');
  },
  error: (category: LogCategory, component: string, message: string, data?: any) => {
    console.error(`[${category}] [${component}] ${message}`, data || '');
  }
};