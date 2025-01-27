export type ErrorType = 
  | 'AUTH_ERROR'        // Authentication/authorization issues
  | 'CHAT_ERROR'        // Chat creation/validation issues
  | 'CONTEXT_ERROR'     // Context assembly issues
  | 'MESSAGE_ERROR'     // Message processing issues
  | 'AI_ERROR'         // OpenAI API issues
  | 'STREAM_ERROR'     // Streaming issues
  | 'VALIDATION_ERROR' // Input validation
  | 'UNKNOWN_ERROR';   // Catch-all

export interface AppError extends Error {
  type: ErrorType;
  status: number;
  retryable: boolean;
  details?: any;
}

const ERROR_CONFIGS: Record<ErrorType, { status: number; retryable: boolean }> = {
  AUTH_ERROR: { status: 401, retryable: false },
  CHAT_ERROR: { status: 404, retryable: false },
  CONTEXT_ERROR: { status: 503, retryable: true },
  MESSAGE_ERROR: { status: 503, retryable: true },
  AI_ERROR: { status: 503, retryable: true },
  STREAM_ERROR: { status: 503, retryable: true },
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

export function handleError(error: any) {
  console.error('Error in Gemini function:', error);

  // If it's already an AppError, use its properties
  if ((error as AppError).type) {
    return {
      error: error.message,
      status: error.status,
      retryable: error.retryable,
      details: error.details
    };
  }

  // Handle specific error patterns
  if (error.message?.includes('not authenticated')) {
    return createAppError('Authentication required', 'AUTH_ERROR');
  }

  if (error.message?.includes('chat not found')) {
    return createAppError('Chat not found', 'CHAT_ERROR');
  }

  if (error.message?.includes('OpenAI')) {
    return createAppError('AI service error', 'AI_ERROR', error.message);
  }

  // Default error response
  return createAppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    error.message
  );
}

export function isRetryableError(error: AppError): boolean {
  return ERROR_CONFIGS[error.type]?.retryable ?? false;
}

export function logError(
  context: string,
  error: any,
  additionalInfo?: Record<string, any>
) {
  console.error(`[${context}] Error:`, {
    message: error.message,
    type: error.type,
    status: error.status,
    retryable: error.retryable,
    details: error.details,
    ...additionalInfo
  });
}