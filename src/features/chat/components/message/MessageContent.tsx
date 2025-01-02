import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { MessageContentProps } from '@/types/chat';

const MessageContent = ({ content, type = 'text' }: MessageContentProps) => {
  console.log('[MessageContent] Rendering with type:', type);

  return (
    <div className={cn(
      "prose prose-invert max-w-none",
      "leading-7",
      type === 'audio' && "italic text-gray-400"
    )}>
      {content}
    </div>
  );
};

export default memo(MessageContent);