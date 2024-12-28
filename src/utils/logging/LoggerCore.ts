import { LogCategory, LogMetadata, LogLevel } from './LogTypes';

class Logger {
  private logToConsole(level: LogLevel, category: LogCategory, component: string, message: string, data?: any) {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      ...data
    };

    const logMessage = `[${category}] [${component}] ${message}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage, metadata);
        break;
      case 'info':
        console.log(logMessage, metadata);
        break;
      case 'warn':
        console.warn(logMessage, metadata);
        break;
      case 'error':
        console.error(logMessage, metadata);
        break;
    }
  }

  debug(category: LogCategory, component: string, message: string, data?: any) {
    this.logToConsole('debug', category, component, message, data);
  }

  info(category: LogCategory, component: string, message: string, data?: any) {
    this.logToConsole('info', category, component, message, data);
  }

  warn(category: LogCategory, component: string, message: string, data?: any) {
    this.logToConsole('warn', category, component, message, data);
  }

  error(category: LogCategory, component: string, message: string, data?: any) {
    this.logToConsole('error', category, component, message, data);
  }

  performance(component: string, operation: string, duration: number, data?: any) {
    this.logToConsole('info', LogCategory.PERFORMANCE, component, operation, {
      duration,
      ...data
    });
  }
}

export const logger = new Logger();

export const wsLogger = {
  connectionStateChange: (component: string, from: string, to: string, data?: any) => {
    logger.info(LogCategory.WEBSOCKET, component, `Connection state changed from ${from} to ${to}`, data);
  }
};