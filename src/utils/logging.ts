export enum LogCategory {
  STATE = 'STATE',
  COMMUNICATION = 'COMMUNICATION',
  ERROR = 'ERROR',
  RENDER = 'RENDER',
  HOOKS = 'HOOKS',
  ROUTING = 'ROUTING'
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  component: string;
  message: string;
  details?: any;
}

class Logger {
  private logs: LogMessage[] = [];
  private readonly maxLogs = 1000;

  private createLogMessage(
    level: LogLevel,
    category: LogCategory,
    component: string,
    message: string,
    details?: any
  ): LogMessage {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      component,
      message,
      details
    };
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    component: string,
    message: string,
    details?: any
  ) {
    const logMessage = this.createLogMessage(level, category, component, message, details);
    
    // Add to internal logs array
    this.logs.push(logMessage);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMessage = `[${logMessage.timestamp}] ${level.toUpperCase()} - ${category} - ${component}: ${message}`;
      switch (level) {
        case 'debug':
          console.debug(consoleMessage, details || '');
          break;
        case 'info':
          console.info(consoleMessage, details || '');
          break;
        case 'warn':
          console.warn(consoleMessage, details || '');
          break;
        case 'error':
          console.error(consoleMessage, details || '');
          break;
      }
    }
  }

  debug(category: LogCategory, component: string, message: string, details?: any) {
    this.log('debug', category, component, message, details);
  }

  info(category: LogCategory, component: string, message: string, details?: any) {
    this.log('info', category, component, message, details);
  }

  warn(category: LogCategory, component: string, message: string, details?: any) {
    this.log('warn', category, component, message, details);
  }

  error(category: LogCategory, component: string, message: string, details?: any) {
    this.log('error', category, component, message, details);
  }

  getLogs(): LogMessage[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();