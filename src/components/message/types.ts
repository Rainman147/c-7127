import type { MessageStatus } from '@/types/chat';

export interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'text' | 'audio';
  id?: string;
  showAvatar?: boolean;
  created_at?: string;
  status?: MessageStatus;
}

export interface MessageContentProps {
  role: 'user' | 'assistant';
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