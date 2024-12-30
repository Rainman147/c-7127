export interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'text' | 'audio';
  id?: string;
  showAvatar?: boolean;
  created_at?: string;
  status?: 'queued' | 'sending' | 'delivered' | 'seen' | 'failed';
}