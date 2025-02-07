
import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { MessageType } from '@/types/chat';

interface MessageContentProps {
  content: string;
  type?: MessageType;
  isAssistant: boolean;
}

const MessageContent = ({ content, type = 'text', isAssistant }: MessageContentProps) => {
  console.log('[MessageContent] Rendering with type:', type);

  return (
    <div className={cn(
      "prose prose-invert max-w-none",
      "leading-7 text-white",
      !isAssistant && "bg-gray-700/50 rounded-[20px] px-4 py-3",
      type === 'audio' && "italic text-gray-400",
      isAssistant && "space-y-6"
    )}>
      {content}
    </div>
  );
};

export default memo(MessageContent);
