import { memo } from 'react';
import Message from './Message';
import { Skeleton } from "@/components/ui/skeleton";
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean;
}

const MessageList = ({ messages, isLoading = false }: MessageListProps) => {
  console.log('[MessageList] Rendering messages:', messages);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-12 w-4/5" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto chat-scrollbar">
      <div className="flex flex-col gap-2 py-4">
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