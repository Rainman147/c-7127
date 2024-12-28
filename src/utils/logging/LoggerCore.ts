import { LogCategory, LogMetadata } from './LogTypes';

class Logger {
  debug(category: LogCategory, component: string, message: string, data?: any) {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      ...data
    };
    console.debug(`[${category}] [${component}] ${message}`, metadata);
  }

  info(category: LogCategory, component: string, message: string, data?: any) {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      ...data
    };
    console.log(`[${category}] [${component}] ${message}`, metadata);
  }

  warn(category: LogCategory, component: string, message: string, data?: any) {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      ...data
    };
    console.warn(`[${category}] [${component}] ${message}`, metadata);
  }

  error(category: LogCategory, component: string, message: string, data?: any) {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      ...data
    };
    console.error(`[${category}] [${component}] ${message}`, metadata);
  }

  performance(component: string, operation: string, duration: number, data?: any) {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      duration,
      ...data
    };
    console.log(`[${LogCategory.PERFORMANCE}] [${component}] ${operation}`, metadata);
  }
}

export const logger = new Logger();
export const wsLogger = logger; // Alias for WebSocket specific logging
export { LogCategory };