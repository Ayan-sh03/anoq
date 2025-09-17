/**
 * Simple logging utility for authentication
 * Provides consistent logging across auth modules
 */

const LOG_PREFIX = '[Auth]';

export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`${LOG_PREFIX} ${message}`, data ? data : '');
  },

  error: (message: string, error?: unknown) => {
    console.error(`${LOG_PREFIX} ${message}`, error ? error : '');
  },

  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${LOG_PREFIX} ${message}`, data ? data : '');
    }
  },
} as const;