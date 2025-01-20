import { ErrorResponse, ErrorType, AppError } from '../types.ts';

const ERROR_CONFIGS: Record<ErrorType, { status: number; retryable: boolean }> = {
  DATABASE_ERROR: { status: 503, retryable: true },
  AI_ERROR: { status: 503, retryable: true },
  VALIDATION_ERROR: { status: 400, retryable: false },
  UNKNOWN_ERROR: { status: 500, retryable: true }
};

export function createAppError(
  message: string,
  type: ErrorType,
  details?: any
): AppError {
  const config = ERROR_CONFIGS[type];
  const error = new Error(message) as AppError;
  error.type = type;
  error.status = config.status;
  error.retryable = config.retryable;
  error.details = details;
  return error;
}

export function handleError(error: any): ErrorResponse {
  console.error('Error in Gemini function:', error);

  // If it's already an AppError, use its properties
  if (error.type && error.status) {
    return {
      error: error.message,
      status: error.status,
      retryable: error.retryable,
      details: error.details
    };
  }

  // Handle specific error types
  if (error.code === 'PGRST301') {
    return {
      error: 'Database connection error',
      status: 503,
      retryable: true,
      details: error.message
    };
  }

  if (error.message?.includes('OpenAI')) {
    return {
      error: 'AI service error',
      status: 503,
      retryable: true,
      details: error.message
    };
  }

  // Default error response
  return {
    error: 'An unexpected error occurred',
    status: 500,
    retryable: true,
    details: error.message
  };
}

export function isRetryableError(error: any): boolean {
  if (error.retryable !== undefined) {
    return error.retryable;
  }

  // Default retry strategy for common HTTP errors
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  return retryableStatusCodes.includes(error.status);
}