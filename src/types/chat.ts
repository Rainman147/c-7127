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
  templateId?: string; // Updated to use templateId instead of full template
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

// Type guard to check if a message is valid
export const isValidMessage = (message: any): message is Message => {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof message.content === 'string' &&
    ['system', 'user', 'assistant'].includes(message.role) &&
    (!message.type || ['text', 'audio'].includes(message.type)) &&
    (!message.status || ['delivered', 'processing', 'failed'].includes(message.status))
  );
};

// Type guard to check if a chat session is valid
export const isValidChatSession = (session: any): session is ChatSession => {
  return (
    typeof session === 'object' &&
    session !== null &&
    Array.isArray(session.messages) &&
    session.messages.every(isValidMessage) &&
    (!session.templateId || typeof session.templateId === 'string') &&
    (!session.patientId || typeof session.patientId === 'string')
  );
};