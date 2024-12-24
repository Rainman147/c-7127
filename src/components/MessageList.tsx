import { memo, useEffect } from 'react';
import MessageListContainer from './message/MessageListContainer';
import { useInitializationSync } from './message/useInitializationSync';
import type { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

const MessageList = memo(({ messages, isLoading = false }: MessageListProps) => {
  logger.debug(LogCategory.RENDER, 'MessageList', 'Rendering with:', { 
    messageCount: messages.length, 
    isLoading 
  });

  const {
    isFullyInitialized,
    setContainerMounted,
    setSubscriptionReady,
    setMessagesLoaded
  } = useInitializationSync();

  useEffect(() => {
    if (messages.length > 0) {
      logger.debug(LogCategory.STATE, 'MessageList', 'Messages loaded:', { count: messages.length });
      setMessagesLoaded(true);
    }
  }, [messages, setMessagesLoaded]);

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