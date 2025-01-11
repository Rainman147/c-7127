import { Message, MessageRole } from './message';

export type { Message, MessageRole };

export interface MessageProps {
  content: string;
  sender: 'user' | 'ai';
  type?: 'text' | 'audio';
}

export interface MessageQuery {
  chatId: string;
  content: string;
  role: MessageRole;
  timestamp: string;
  status: 'sending' | 'sent' | 'error';
  type?: 'text' | 'audio';
}

export interface ChatSession {
  id: string;
  templateId?: string;
  patientId?: string;
  status: 'active' | 'archived';
  lastMessage?: string;
  systemInstructions?: string;
}

// Query key factories
export const messageKeys = {
  all: ['messages'] as const,
  chat: (chatId: string) => ['messages', chatId] as const,
  detail: (chatId: string, messageId: string) => ['messages', chatId, messageId] as const,
} as const;

export const sessionKeys = {
  all: ['sessions'] as const,
  detail: (sessionId: string) => ['sessions', sessionId] as const,
  active: () => ['sessions', 'active'] as const,
} as const;