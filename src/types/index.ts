export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'audio';
  isStreaming?: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  instructions?: string;
}