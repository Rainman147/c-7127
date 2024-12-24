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

export type MessageUpdate = {
  id: string;
  content: string;
  type?: 'text' | 'audio';
};

export type MessageAction = {
  type: 'edit' | 'delete' | 'regenerate';
  messageId: string;
};

export type MessageFilter = {
  role?: 'user' | 'assistant';
  type?: 'text' | 'audio';
  startDate?: Date;
  endDate?: Date;
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
