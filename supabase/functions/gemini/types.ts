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
  | 'AUTHENTICATION_ERROR'
  | 'CONTEXT_ERROR' 
  | 'DATABASE_ERROR'
  | 'AI_SERVICE_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError extends Error {
  type: ErrorType;
  status: number;
  retryable: boolean;
  details?: any;
}