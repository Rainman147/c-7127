
export type MessageRole = 'system' | 'user' | 'assistant';
export type MessageType = 'text' | 'audio';
export type MessageStatus = 'delivered' | 'processing' | 'failed';

export interface Message {
  id?: string;
  chat_id: string;
  role: MessageRole;
  content: string;
  type?: MessageType;
  status?: MessageStatus;
  created_at?: string;
  metadata?: Record<string, any>;
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
  chat_id: dbMessage.chat_id,
  role: dbMessage.role,
  content: dbMessage.content,
  type: dbMessage.type || 'text',
  status: dbMessage.status || 'delivered',
  created_at: dbMessage.created_at,
  metadata: dbMessage.metadata
});
