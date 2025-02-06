import type { Template } from './template';

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
  templateId?: string;
  patientId?: string;
}

// Helper function to convert database message to frontend format
export const mapDatabaseMessageToMessage = (dbMessage: any): Message => ({
  id: dbMessage.id,
  role: dbMessage.role,
  content: dbMessage.content,
  type: dbMessage.type || 'text',
  status: dbMessage.status || 'delivered',
  created_at: dbMessage.created_at
});