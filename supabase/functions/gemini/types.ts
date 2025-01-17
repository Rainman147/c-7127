export interface ChatContext {
  templateInstructions?: string;
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
}