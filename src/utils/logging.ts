export enum LogCategory {
  STATE = 'STATE',
  ERROR = 'ERROR',
  RENDER = 'RENDER',
  ROUTING = 'ROUTING',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK'
}

export const logger = {
  debug: (category: LogCategory, source: string, message: string, data?: any) => {
    console.debug(`[${category}] ${source}: ${message}`, data);
  },
  info: (category: LogCategory, source: string, message: string, data?: any) => {
    console.info(`[${category}] ${source}: ${message}`, data);
  },
  warn: (category: LogCategory, source: string, message: string, data?: any) => {
    console.warn(`[${category}] ${source}: ${message}`, data);
  },
  error: (category: LogCategory, source: string, message: string, data?: any) => {
    console.error(`[${category}] ${source}: ${message}`, data);
  }
};
