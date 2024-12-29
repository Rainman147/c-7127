import { MessageLoadingState } from './message/MessageLoadingState';
import { MessageEmptyState } from './message/MessageEmptyState';
import MessageListContainer from './message/MessageListContainer';
import { useMessageState } from '@/hooks/chat/useMessageState';
import { logger, LogCategory } from '@/utils/logging';

const MessageList = ({ isLoading }: { isLoading?: boolean }) => {
  const { messages } = useMessageState();

  logger.debug(LogCategory.RENDER, 'MessageList', 'Rendering message list:', {
    isLoading,
    messageCount: messages?.length || 0,
    messageDetails: messages?.map(m => ({
      id: m.id,
      role: m.role,
      contentPreview: m.content?.substring(0, 50),
      sequence: m.sequence,
      status: m.status,
      created_at: m.created_at,
      isOptimistic: m.isOptimistic
    })),
    renderStack: new Error().stack,
    renderTime: performance.now(),
    renderContext: {
      hasMessages: messages?.length > 0,
      loadingState: isLoading ? 'loading' : messages?.length === 0 ? 'empty' : 'loaded'
    }
  });

  if (isLoading) {
    logger.info(LogCategory.STATE, 'MessageList', 'Showing loading state');
    return <MessageLoadingState />;
  }

  if (!messages || messages.length === 0) {
    logger.info(LogCategory.STATE, 'MessageList', 'Showing empty state', {
      messages,
      isArray: Array.isArray(messages),
      isLoading
    });
    return <MessageEmptyState />;
  }

  logger.info(LogCategory.STATE, 'MessageList', 'Rendering messages', {
    messageCount: messages.length,
    firstMessageId: messages[0]?.id,
    lastMessageId: messages[messages.length - 1]?.id
  });

  return <MessageListContainer />;
};

export default MessageList;