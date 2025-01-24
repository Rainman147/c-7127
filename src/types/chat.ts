export type MessageRole = 'system' | 'user' | 'assistant';
export type MessageType = 'text' | 'audio';
export type MessageStatus = 'delivered' | 'processing' | 'failed';

export interface Message {
  id?: string;
  role: MessageRole;
  content: string;
  type?: MessageType;
  status?: MessageStatus;
  created_at?: string;
}

export interface MessageProps {
  content: string;
  sender: 'user' | 'ai';
  type?: MessageType;
}

export interface ChatSession {
  id?: string;
  messages: Message[];
  template?: Template;
  patientId?: string;
}