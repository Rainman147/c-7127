export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'audio';
  isStreaming?: boolean;
}