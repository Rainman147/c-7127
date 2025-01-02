import { memo } from 'react';
import { cn } from '@/lib/utils';
import MessageAvatar from './MessageAvatar';
import MessageContent from './MessageContent';
import MessageActions from './MessageActions';
import type { MessageProps } from '@/types/chat';

const Message = ({ content, sender, type = 'text' }: MessageProps) => {
  console.log('[Message] Rendering message from:', sender);
  
  const isAIMessage = sender === 'ai';

  return (
    <div className={cn(
      "group relative px-4 py-6 text-gray-100",
      "hover:bg-gray-800/50 transition-colors",
      isAIMessage ? "bg-gray-800/30" : ""
    )}>
      <div className="relative m-auto flex max-w-3xl gap-4 px-4">
        <MessageAvatar sender={sender} />
        <div className="flex-1 space-y-4">
          <MessageContent content={content} type={type} />
        </div>
        <MessageActions content={content} isAIMessage={isAIMessage} />
      </div>
    </div>
  );
};

export default memo(Message);