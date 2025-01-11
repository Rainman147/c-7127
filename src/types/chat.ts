import type { Template } from './template';

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'audio';
  isStreaming?: boolean;
}

export interface TemplateContext {
  id: string;
  template: Template;
  systemInstructions: string;
  version?: number;
  metadata?: Record<string, any>;
}