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
    hasMessages: messages.length > 0,
    messageDetails: messages.map(m => ({
      id: m.id,
      role: m.role,
      type: m.type,
      sequence: m.sequence,
      isOptimistic: m.isOptimistic,
      contentPreview: m.content?.substring(0, 50),
      created_at: m.created_at
    }))
  });

  if (isLoading) {
    logger.info(LogCategory.STATE, 'MessageList', 'Showing loading state');
    return <MessageLoadingState />;
  }

  if (!messages || messages.length === 0) {
    logger.info(LogCategory.STATE, 'MessageList', 'Showing empty state', {
      messages: messages,
      isArray: Array.isArray(messages),
      isLoading
    });
    return <MessageEmptyState />;
  }

  logger.debug(LogCategory.RENDER, 'MessageList', 'Rendering message container', {
    messageCount: messages.length,
    firstMessage: {
      id: messages[0]?.id,
      role: messages[0]?.role,
      contentPreview: messages[0]?.content?.substring(0, 50),
      sequence: messages[0]?.sequence
    },
    lastMessage: {
      id: messages[messages.length - 1]?.id,
      role: messages[messages.length - 1]?.role,
      contentPreview: messages[messages.length - 1]?.content?.substring(0, 50),
      sequence: messages[messages.length - 1]?.sequence
    }
  });
  
  return <MessageListContainer />;
};

export default MessageList;