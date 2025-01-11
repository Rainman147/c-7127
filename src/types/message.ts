export type MessageRole = 'user' | 'assistant';
export type MessageType = 'text' | 'audio';
export type MessageStatus = 'queued' | 'sending' | 'sent' | 'error';

export interface MessageMetadata {
  sequence?: number;
  deliveredAt?: string;
  seenAt?: string;
  patientId?: string;
}

// Database message type
export interface DbMessage {
  id: string;
  chat_id: string;
  content: string;
  sender: string;
  type: string;
  status?: string;
  created_at: string;
  sequence?: number;
  delivered_at?: string;
  seen_at?: string;
}

// Frontend message type
export interface Message {
  id?: string;
  chatId: string;
  content: string;
  role: MessageRole;
  type: MessageType;
  status?: MessageStatus;
  createdAt?: string;
  metadata?: MessageMetadata;
  isStreaming?: boolean;
  wasEdited?: boolean;
}

// Template context types
export interface TemplateContext {
  id: string;
  templateId: string;
  chatId?: string;
  messageId?: string;
  systemInstructions: string;
  metadata?: Record<string, any>;
  version?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface DbTemplateContext {
  id: string;
  template_id: string;
  chat_id?: string;
  message_id?: string;
  system_instructions: string;
  metadata?: Record<string, any>;
  version?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Message with template context
export interface MessageWithContext extends Message {
  templateContext?: TemplateContext;
}

// Type guard to check if a message is from the database
export const isDbMessage = (message: any): message is DbMessage => {
  return (
    message &&
    typeof message.chat_id === 'string' &&
    typeof message.sender === 'string' &&
    typeof message.content === 'string'
  );
};

// Type guard for template context
export const isTemplateContext = (context: any): context is TemplateContext => {
  return (
    context &&
    typeof context.templateId === 'string' &&
    typeof context.systemInstructions === 'string'
  );
};