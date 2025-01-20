export interface ChatContext {
  systemInstructions?: string;
  patientContext?: string;
  messageHistory: { 
    role: string; 
    content: string; 
    type?: 'text' | 'audio';
    sequence?: number;
  }[];
}

export interface MessageMetadata {
  sequence: number;
  type: 'text' | 'audio';
  status?: 'queued' | 'processing' | 'delivered' | 'failed';
}

export interface ErrorResponse {
  error: string;
  status: number;
  details?: any;
  retryable: boolean;
}

export type ErrorType = 
  | 'DATABASE_ERROR'    // Any database-related issues
  | 'AI_ERROR'         // OpenAI API issues
  | 'VALIDATION_ERROR' // Input validation
  | 'UNKNOWN_ERROR';   // Catch-all

export interface AppError extends Error {
  type: ErrorType;
  status: number;
  retryable: boolean;
  details?: any;
}