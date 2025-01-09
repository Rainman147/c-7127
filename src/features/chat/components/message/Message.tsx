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
      <div className={cn(
        "relative m-auto flex gap-4 px-4",
        "max-w-3xl",
        !isAIMessage && "justify-end"
      )}>
        {isAIMessage && <MessageAvatar sender={sender} />}
        <div className={cn(
          "space-y-4",
          isAIMessage ? "flex-1" : "max-w-[80%] md:max-w-[80%] sm:max-w-[90%]"
        )}>
          <MessageContent content={content} type={type} isAIMessage={isAIMessage} />
        </div>
        {!isAIMessage && <MessageAvatar sender={sender} />}
        <MessageActions content={content} isAIMessage={isAIMessage} />
      </div>
    </div>
  );
};

export default memo(Message);