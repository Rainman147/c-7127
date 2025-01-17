import { ErrorResponse } from '../types.ts';

export function handleError(error: any): ErrorResponse {
  console.error('Error in Gemini function:', error);
  
  if (error.status) {
    return {
      error: error.message || 'API error occurred',
      status: error.status,
      details: error.details
    };
  }

  return {
    error: error.message || 'An unexpected error occurred',
    status: 500,
    details: error
  };
}