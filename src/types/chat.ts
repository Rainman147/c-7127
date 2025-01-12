import type { Template } from './template';

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'audio';
  isStreaming?: boolean;
}

export interface MessageProps {
  content: string;
  sender: 'user' | 'ai';
  type?: 'text' | 'audio';
}

export interface TemplateContext {
  id: string;
  template: Template;
  systemInstructions: string;
  version?: number;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id?: string;
  messages: Message[];
  template?: Template;
  patientId?: string;
}