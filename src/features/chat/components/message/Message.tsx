import { memo } from 'react';
import MessageActions from './MessageActions';
import MessageAvatar from './MessageAvatar';
import { cn } from '@/lib/utils';
import type { MessageProps } from '@/types/chat';

const Message = memo(({ content, sender, type = 'text' }: MessageProps) => {
  const isAIMessage = sender === 'ai';

  return (
    <div className={cn(
      "py-3 px-4 w-full flex gap-4 text-gray-100",
      isAIMessage ? "bg-chatgpt-hover" : ""
    )}>
      <MessageAvatar isAIMessage={isAIMessage} />
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex justify-between gap-2">
          <span className="font-semibold">
            {isAIMessage ? 'Assistant' : 'You'}
          </span>
          <MessageActions content={content} isAIMessage={isAIMessage} />
        </div>
        <div className="prose prose-invert max-w-none">
          {content}
        </div>
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export default Message;