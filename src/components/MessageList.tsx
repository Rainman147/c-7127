import { MessageLoadingState } from './message/MessageLoadingState';
import { MessageEmptyState } from './message/MessageEmptyState';
import MessageListContainer from './message/MessageListContainer';
import { useMessageState } from '@/hooks/chat/useMessageState';

const MessageList = ({ isLoading }: { isLoading?: boolean }) => {
  const { messages } = useMessageState();

  if (isLoading) {
    return <MessageLoadingState />;
  }

  if (messages.length === 0) {
    return <MessageEmptyState />;
  }

  return <MessageListContainer />;
};

export default MessageList;