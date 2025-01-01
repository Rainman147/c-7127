export type Message = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'text' | 'audio';
  id?: string;
};

export interface MessageProps {
  content: string;
  sender: 'user' | 'ai';
  type?: 'text' | 'audio';
}

export interface MessageActionsProps {
  content: string;
  isAIMessage: boolean;
}