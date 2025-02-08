
import type { Json } from '@/integrations/supabase/types';

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'audio' | 'image';

export interface Message {
  id?: string;
  chatId: string;
  role: MessageRole;
  content: string;
  type?: MessageType;
  metadata?: Record<string, any>;
  createdAt?: string;
  status?: 'delivered' | 'pending' | 'error';
}

export interface ChatSession {
  id?: string;
  messages: Message[];
  templateId?: string;
  patientId?: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  userId: string;
}

export interface ChatContext {
  sessionId: string;
  templateId?: string;
  patientId?: string;
  messages: Message[];
}
