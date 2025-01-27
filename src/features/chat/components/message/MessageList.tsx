import { memo, useRef, useEffect } from 'react';
import Message from './Message';
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
}

const MessageList = ({ messages }: MessageListProps) => {
  console.log('[MessageList] Rendering messages:', messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto chat-scrollbar">
      <div className="flex flex-col gap-2 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Start a new conversation
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message
                key={message.id || `${message.role}-${message.content}`}
                content={message.content}
                sender={message.role === 'user' ? 'user' : 'ai'}
                type={message.type}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default memo(MessageList);