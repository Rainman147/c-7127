import { MessageLoadingState } from './message/MessageLoadingState';
import { MessageEmptyState } from './message/MessageEmptyState';
import MessageListContainer from './message/MessageListContainer';
import { useMessageState } from '@/hooks/chat/useMessageState';
import { logger, LogCategory } from '@/utils/logging';

const MessageList = ({ isLoading }: { isLoading?: boolean }) => {
  const { messages } = useMessageState();

  // Enhanced logging for message loading and state transitions
  logger.debug(LogCategory.STATE, 'MessageList', 'Rendering with state:', {
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
      created_at: m.created_at,
      status: m.status,
      timestamp: new Date().toISOString()
    }))
  });

  if (isLoading) {
    logger.info(LogCategory.STATE, 'MessageList', 'Showing loading state', {
      timestamp: new Date().toISOString()
    });
    return <MessageLoadingState />;
  }

  if (!messages || messages.length === 0) {
    logger.info(LogCategory.STATE, 'MessageList', 'Showing empty state', {
      messages: messages,
      isArray: Array.isArray(messages),
      isLoading,
      timestamp: new Date().toISOString()
    });
    return <MessageEmptyState />;
  }

  logger.debug(LogCategory.RENDER, 'MessageList', 'Rendering message container', {
    messageCount: messages.length,
    firstMessage: messages[0] ? {
      id: messages[0].id,
      role: messages[0].role,
      contentPreview: messages[0].content?.substring(0, 50),
      sequence: messages[0].sequence,
      status: messages[0].status,
      created_at: messages[0].created_at
    } : null,
    lastMessage: messages.length > 0 ? {
      id: messages[messages.length - 1].id,
      role: messages[messages.length - 1].role,
      contentPreview: messages[messages.length - 1].content?.substring(0, 50),
      sequence: messages[messages.length - 1].sequence,
      status: messages[messages.length - 1].status,
      created_at: messages[messages.length - 1].created_at
    } : null,
    timestamp: new Date().toISOString()
  });
  
  return <MessageListContainer />;
};

export default MessageList;