import { memo, useId } from 'react';
import Message from '../Message';
import type { Message as MessageType } from '@/types/chat';

interface MessageItemProps {
  message: MessageType;
  showAvatar: boolean;
  index: number;
}

const MessageItem = memo(({ message, showAvatar, index }: MessageItemProps) => {
  const componentId = useId();
  console.log('[MessageItem] Rendering message:', { id: message.id, index, componentId });
  
  if (!message) {
    console.warn('[MessageItem] Received null message at index:', index);
    return null;
  }

  return (
    <Message 
      key={message.id || index} 
      {...message} 
      showAvatar={showAvatar}
    />
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;