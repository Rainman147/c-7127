import type { Message } from '@/types/chat';

export interface MessageListContainerProps {
  messages: Message[];
  isLoading?: boolean;
  isInitialized?: boolean;
  onContainerMount?: () => void;
  onSubscriptionReady?: () => void;
  onMessagesLoad?: () => void;
}

export interface MountResolution {
  containerMounted: boolean;
  messagesLoaded: boolean;
  initialScrollExecuted: boolean;
}

export interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'text' | 'audio';
  id?: string;
  showAvatar?: boolean;
  editedContent?: string;
  isEditing?: boolean;
  wasEdited?: boolean;
  isSaving?: boolean;
  isTyping?: boolean;
  onSave?: (content: string) => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

export interface MessageGroupsProps {
  messages: Message[];
}