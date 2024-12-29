import { MessageLoadingState } from './message/MessageLoadingState';
import { MessageEmptyState } from './message/MessageEmptyState';
import MessageListContainer from './message/MessageListContainer';
import { useMessageState } from '@/hooks/chat/useMessageState';
import { logger, LogCategory } from '@/utils/logging';

const MessageList = ({ isLoading }: { isLoading?: boolean }) => {
  const { messages } = useMessageState();

  logger.debug(LogCategory.RENDER, 'MessageList', 'Rendering with state:', {
    isLoading,
    messageCount: messages.length,
    messageIds: messages.map(m => m.id),
    hasMessages: messages.length > 0
  });

  if (isLoading) {
    logger.info(LogCategory.STATE, 'MessageList', 'Showing loading state');
    return <MessageLoadingState />;
  }

  if (messages.length === 0) {
    logger.info(LogCategory.STATE, 'MessageList', 'Showing empty state');
    return <MessageEmptyState />;
  }

  logger.debug(LogCategory.RENDER, 'MessageList', 'Rendering message container', {
    messageCount: messages.length
  });
  
  return <MessageListContainer />;
};

export default MessageList;