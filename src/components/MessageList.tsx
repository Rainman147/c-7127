import { memo } from 'react';
import MessageListContainer from './message/MessageListContainer';
import { useInitializationSync } from './message/useInitializationSync';
import type { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

const MessageList = memo(({ messages, isLoading = false }: MessageListProps) => {
  const {
    isFullyInitialized,
    setContainerMounted,
    setSubscriptionReady,
    setMessagesLoaded
  } = useInitializationSync();

  return (
    <MessageListContainer
      messages={messages}
      isLoading={isLoading}
      isInitialized={isFullyInitialized}
      onContainerMount={setContainerMounted}
      onSubscriptionReady={setSubscriptionReady}
      onMessagesLoad={setMessagesLoaded}
    />
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;