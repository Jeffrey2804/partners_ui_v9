/**
 * Professional logging utility for the dashboard application
 * Provides structured logging with different levels and environment awareness
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;

class Logger {
  constructor(context = 'App', disabled = false) {
    this.context = context;
    this.disabled = disabled;
  }

  error(message, error = null, data = null) {
    if (this.disabled) return;

    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      const logData = {
        level: 'ERROR',
        context: this.context,
        message,
        timestamp: new Date().toISOString(),
        ...(error && { error: error.message || error }),
        ...(data && { data }),
      };

      if (process.env.NODE_ENV === 'development') {
        console.error('❌', logData);
      }
      // In production, you might want to send this to a logging service
    }
  }

  warn(message, data = null) {
    if (this.disabled) return;

    if (currentLogLevel >= LOG_LEVELS.WARN) {
      const logData = {
        level: 'WARN',
        context: this.context,
        message,
        timestamp: new Date().toISOString(),
        ...(data && { data }),
      };

      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️', logData);
      }
    }
  }

  info(message, data = null) {
    if (this.disabled) return;

    if (currentLogLevel >= LOG_LEVELS.INFO) {
      const logData = {
        level: 'INFO',
        context: this.context,
        message,
        timestamp: new Date().toISOString(),
        ...(data && { data }),
      };

      if (process.env.NODE_ENV === 'development') {
        console.info('ℹ️', logData);
      }
    }
  }

  debug(message, data = null) {
    if (this.disabled) return;

    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      const logData = {
        level: 'DEBUG',
        context: this.context,
        message,
        timestamp: new Date().toISOString(),
        ...(data && { data }),
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍', logData);
      }
    }
  }

  success(message, data = null) {
    if (this.disabled) return;

    if (currentLogLevel >= LOG_LEVELS.INFO) {
      const logData = {
        level: 'SUCCESS',
        context: this.context,
        message,
        timestamp: new Date().toISOString(),
        ...(data && { data }),
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('✅', logData);
      }
    }
  }
}

// Create logger instances for different contexts
export const createLogger = (context) => new Logger(context);

// Default logger
export const logger = new Logger();

// Context-specific loggers
export const apiLogger = new Logger('API');
export const pipelineLogger = new Logger('Pipeline', true); // Disabled pipeline logger
export const taskLogger = new Logger('Task');
export const uiLogger = new Logger('UI');
