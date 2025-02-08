
import type { Json } from '@/integrations/supabase/types';
import type { MessageRole, MessageType } from './database';

export interface Message {
  id?: string;
  chatId: string;
  role: MessageRole;
  content: string;
  type?: MessageType;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface ChatSession {
  id?: string;
  messages: Message[];
  templateId?: string;
  patientId?: string;
  createdAt?: string;
  updatedAt?: string;
  userId: string;
}
