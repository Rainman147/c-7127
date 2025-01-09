import { memo } from 'react';
import { cn } from '@/lib/utils';

interface MessageContentProps {
  content: string;
  type?: 'text' | 'audio';
  isAIMessage?: boolean;
}

const MessageContent = ({ content, type = 'text', isAIMessage = false }: MessageContentProps) => {
  console.log('[MessageContent] Rendering with type:', type);

  return (
    <div className={cn(
      "prose prose-invert max-w-none",
      "leading-7 text-white",
      !isAIMessage && "bg-gray-700/50 rounded-[20px] px-4 py-3",
      type === 'audio' && "italic text-gray-400",
      isAIMessage && "space-y-6"
    )}>
      {content}
    </div>
  );
};

export default memo(MessageContent);