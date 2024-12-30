import { MessageLoadingState } from './message/MessageLoadingState';
import { MessageEmptyState } from './message/MessageEmptyState';
import { MessageErrorState } from './message/MessageErrorState';
import MessageListContainer from './message/MessageListContainer';
import { useMessages } from '@/contexts/MessageContext';
import { logger, LogCategory } from '@/utils/logging';

interface MessageListProps {
  isLoading?: boolean;
  loadingMessage?: string;
  loadingProgress?: number;
  currentOperation?: string;
}

const MessageList = ({ 
  isLoading, 
  loadingMessage,
  loadingProgress,
  currentOperation
}: MessageListProps) => {
  const { messages, error, retryLoading } = useMessages();

  logger.debug(LogCategory.RENDER, 'MessageList', 'Rendering message list:', {
    isLoading,
    messageCount: messages?.length || 0,
    error,
    loadingProgress,
    currentOperation,
    messageDetails: messages?.map(m => ({
      id: m.id,
      role: m.role,
      contentPreview: m.content?.substring(0, 50),
      sequence: m.sequence,
      status: m.status,
      created_at: m.created_at,
      isOptimistic: m.isOptimistic
    })),
    renderContext: {
      hasMessages: messages?.length > 0,
      loadingState: isLoading ? 'loading' : messages?.length === 0 ? 'empty' : 'loaded'
    }
  });

  if (error) {
    logger.error(LogCategory.STATE, 'MessageList', 'Error state:', { error });
    return (
      <MessageErrorState 
        error={error} 
        onRetry={retryLoading}
        errorDetails="There was a problem loading your messages. Please try again."
      />
    );
  }

  if (isLoading) {
    logger.info(LogCategory.STATE, 'MessageList', 'Showing loading state');
    return (
      <MessageLoadingState 
        message={loadingMessage} 
        progress={loadingProgress}
        currentOperation={currentOperation}
      />
    );
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