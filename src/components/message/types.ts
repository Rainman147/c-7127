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