import { memo, useEffect, useRef, useState } from 'react';
import MessageListContainer from './message/MessageListContainer';
import type { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';
import type { MountResolution } from './message/types';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

const MessageList = memo(({ messages, isLoading = false }: MessageListProps) => {
  const [mountResolution, setMountResolution] = useState<MountResolution>({
    containerMounted: false,
    messagesLoaded: false,
    initialScrollExecuted: false
  });

  useEffect(() => {
    logger.debug(LogCategory.RENDER, 'MessageList', 'Mount resolution state:', mountResolution);
  }, [mountResolution]);

  const handleContainerMount = () => {
    logger.debug(LogCategory.STATE, 'MessageList', 'Container mounted');
    setMountResolution(prev => ({ ...prev, containerMounted: true }));
  };

  const handleMessagesLoad = () => {
    logger.debug(LogCategory.STATE, 'MessageList', 'Messages loaded');
    setMountResolution(prev => ({ ...prev, messagesLoaded: true }));
  };

  return (
    <MessageListContainer
      messages={messages}
      isLoading={isLoading}
      mountResolution={mountResolution}
      onContainerMount={handleContainerMount}
      onMessagesLoad={handleMessagesLoad}
    />
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;