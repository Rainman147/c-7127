export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'audio';
  sequence?: number;
  created_at?: string;
  isOptimistic?: boolean;
};

export type MessageGroup = {
  id: string;
  label: string;
  timestamp: string;
  messages: Message[];
};

export type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'text' | 'audio';
  id?: string;
  showAvatar?: boolean;
};

export interface MountResolution {
  containerMounted: boolean;
  messagesLoaded: boolean;
  initialScrollExecuted: boolean;
}

export interface MessageListContainerProps {
  messages: Message[];
  isLoading?: boolean;
  mountResolution: MountResolution;
  onContainerMount?: () => void;
  onMessagesLoad?: () => void;
}

export interface MessageGroupsProps {
  messages: Message[];
}