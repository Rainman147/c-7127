import { memo } from 'react';
import Message from './Message';
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
}

const MessageList = ({ messages }: MessageListProps) => {
  console.log('[MessageList] Rendering messages:', messages);

  return (
    <div className="h-full overflow-y-auto px-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
      <div className="flex flex-col gap-4 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Start a new conversation
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id || `${message.role}-${message.content}`}
              content={message.content}
              sender={message.role === 'user' ? 'user' : 'ai'}
              type={message.type}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default memo(MessageList);