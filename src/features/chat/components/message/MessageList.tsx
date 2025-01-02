import { memo } from 'react';
import Message from './Message';
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
}

const MessageList = ({ messages }: MessageListProps) => {
  console.log('[MessageList] Rendering messages:', messages);

  return (
    <div className="flex-1 overflow-y-auto px-4">
      <div className="flex flex-col gap-4 py-4">
        {messages.map((message) => (
          <Message
            key={message.id || `${message.role}-${message.content}`}
            content={message.content}
            sender={message.role === 'user' ? 'user' : 'ai'}
            type={message.type}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(MessageList);