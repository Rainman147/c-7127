
import { memo, useRef, useEffect } from 'react';
import Message from './Message';
import type { Message as MessageType } from '@/types/chat';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean;
}

const MessageList = ({ messages, isLoading }: MessageListProps) => {
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
        {messages.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Start a new conversation
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message
                key={message.id || `${message.role}-${message.content}`}
                message={message}
              />
            ))}
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default memo(MessageList);
