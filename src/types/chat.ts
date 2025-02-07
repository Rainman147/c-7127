
export type MessageRole = 'system' | 'user' | 'assistant';
export type MessageType = 'text' | 'audio';

export interface Message {
  id?: string;
  chat_id: string;
  role: MessageRole;
  content: string;
  type?: MessageType;
  created_at?: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id?: string;
  messages: Message[];
  templateId?: string;
  patientId?: string;
}
