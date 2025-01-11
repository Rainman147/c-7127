export type MessageRole = 'user' | 'assistant';
export type MessageType = 'text' | 'audio';
export type MessageStatus = 'queued' | 'sending' | 'sent' | 'error';

export interface MessageMetadata {
  sequence?: number;
  deliveredAt?: string;
  seenAt?: string;
}

export interface TemplateContext {
  templateId?: string;
  systemInstructions?: string;
}

export interface Message {
  id?: string;
  chatId: string;
  content: string;
  role: MessageRole;
  type: MessageType;
  status?: MessageStatus;
  createdAt?: string;
  metadata?: MessageMetadata;
  templateContext?: TemplateContext;
  isStreaming?: boolean;
}

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
  template_context?: string | Record<string, any>;
}