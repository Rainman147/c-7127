export enum LogCategory {
  STATE = 'STATE',
  ERROR = 'ERROR',
  RENDER = 'RENDER',
  ROUTING = 'ROUTING',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  COMMUNICATION = 'COMMUNICATION',
  HOOKS = 'HOOKS',
  VALIDATION = 'VALIDATION',
  SESSION = 'SESSION',
  API = 'API',
  LIFECYCLE = 'LIFECYCLE',
  PERFORMANCE = 'PERFORMANCE',
  MERGE = 'MERGE',
  QUEUE = 'QUEUE'  // Added this
}

export const logger = {
  debug: (category: LogCategory, source: string, message: string, data?: any) => {
    console.debug(`[${category}] ${source}: ${message}`, data ? {
      timestamp: new Date().toISOString(),
      ...data
    } : '');
  },
  info: (category: LogCategory, source: string, message: string, data?: any) => {
    console.info(`[${category}] ${source}: ${message}`, data ? {
      timestamp: new Date().toISOString(),
      ...data
    } : '');
  },
  warn: (category: LogCategory, source: string, message: string, data?: any) => {
    console.warn(`[${category}] ${source}: ${message}`, data ? {
      timestamp: new Date().toISOString(),
      ...data
    } : '');
  },
  error: (category: LogCategory, source: string, message: string, data?: any) => {
    console.error(`[${category}] ${source}: ${message}`, data ? {
      timestamp: new Date().toISOString(),
      stack: new Error().stack,
      ...data
    } : '');
  },
  merge: (source: string, message: string, data?: any) => {
    console.info(`[MERGE] ${source}: ${message}`, data ? {
      timestamp: new Date().toISOString(),
      ...data
    } : '');
  }
};