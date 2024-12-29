import { MessageLoadingState } from './message/MessageLoadingState';
import { MessageEmptyState } from './message/MessageEmptyState';
import MessageListContainer from './message/MessageListContainer';
import { useMessageState } from '@/hooks/chat/useMessageState';

const MessageList = ({ isLoading }: { isLoading?: boolean }) => {
  const { messages } = useMessageState();

  console.log('[MessageList] Rendering with state:', {
    isLoading,
    messageCount: messages.length,
    messageIds: messages.map(m => m.id),
    hasMessages: messages.length > 0
  });

  if (isLoading) {
    console.log('[MessageList] Showing loading state');
    return <MessageLoadingState />;
  }

  if (messages.length === 0) {
    console.log('[MessageList] Showing empty state');
    return <MessageEmptyState />;
  }

  console.log('[MessageList] Rendering message container');
  return <MessageListContainer />;
};

export default MessageList;