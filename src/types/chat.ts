export type MessageStatus = 'queued' | 'sending' | 'delivered' | 'seen' | 'failed';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'audio';
  sequence?: number;
  created_at?: string;
  isOptimistic?: boolean;
  status?: MessageStatus;
  delivered_at?: string;
  seen_at?: string;
  error?: string;
}

export interface MessageGroup {
  label: string;
  timestamp: string;
  messages: Message[];
}