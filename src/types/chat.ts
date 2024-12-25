export type MessageRole = 'user' | 'assistant';
export type MessageType = 'text' | 'audio';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  type?: MessageType;
  sequence?: number;
  created_at?: string;
  isOptimistic?: boolean;
}

export interface MessageGroup {
  id: string;
  label: string;
  timestamp: string;
  messages: Message[];
}

export interface MessageUpdate {
  id: string;
  content: string;
  type?: MessageType;
}

export interface MessageAction {
  type: 'edit' | 'delete' | 'regenerate';
  messageId: string;
}

export interface MessageFilter {
  role?: MessageRole;
  type?: MessageType;
  startDate?: Date;
  endDate?: Date;
}