export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'queued' | 'sending' | 'delivered' | 'seen' | 'failed';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  type?: 'text' | 'audio';
  sequence?: number;
  created_at?: string;
  isOptimistic?: boolean;
  status?: MessageStatus;
  delivered_at?: string;
  seen_at?: string;
  error?: string;
  chat_id: string;
  transactionId?: string; // Added this field
}

export interface MessageGroup {
  id: string;
  label: string;
  timestamp: string;
  messages: Message[];
}

export interface MessageProps extends Message {
  isStreaming?: boolean;
  showAvatar?: boolean;
}

export interface MessageContentProps {
  role: MessageRole;
  content: string;
  type?: 'text' | 'audio';
  isStreaming?: boolean;
  isEditing: boolean;
  id?: string;
  wasEdited: boolean;
  isSaving: boolean;
  isTyping: boolean;
  isOptimistic?: boolean;
  isFailed?: boolean;
  created_at?: string;
  status?: MessageStatus;
  onSave: (newContent: string) => void;
  onCancel: () => void;
  onRetry?: () => void;
}