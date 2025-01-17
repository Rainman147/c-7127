export interface ChatContext {
  templateInstructions?: string;
  patientContext?: string;
  messageHistory: { role: string; content: string }[];
}

export interface MessageMetadata {
  sequence: number;
  type: 'text' | 'audio';
}

export interface ErrorResponse {
  error: string;
  status: number;
  details?: any;
}