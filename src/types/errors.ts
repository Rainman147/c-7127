/**
 * Standardized error types for the messaging system
 */

export interface BaseError {
  code: string;
  message: string;
  technical?: string;
  retryable: boolean;
}

export interface MessageError extends BaseError {
  messageId?: string;
  chatId?: string;
}

export interface TranscriptionError extends BaseError {
  audioId?: string;
  duration?: number;
}

export interface TemplateError extends BaseError {
  templateId?: string;
  version?: number;
}

export const createMessageError = (
  code: string,
  message: string,
  technical?: string,
  retryable = true
): MessageError => ({
  code,
  message,
  technical,
  retryable
});

export const isRetryableError = (error: BaseError): boolean => {
  return error.retryable && !['AUTH', 'VALIDATION', 'NOT_FOUND'].includes(error.code);
};

// Common error factories
export const createNetworkError = (technical?: string): BaseError => ({
  code: 'NETWORK',
  message: 'Unable to connect to the server',
  technical,
  retryable: true
});

export const createValidationError = (message: string, technical?: string): BaseError => ({
  code: 'VALIDATION',
  message,
  technical,
  retryable: false
});

export const createAuthError = (message = 'Authentication required'): BaseError => ({
  code: 'AUTH',
  message,
  retryable: false
});