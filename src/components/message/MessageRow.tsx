import { memo, useEffect, useRef } from 'react';
import Message from '../Message';
import type { MessageGroup } from '@/types/chat';

interface MessageRowProps {
  style: React.CSSProperties;
  group: MessageGroup;
  onHeightChange?: (height: number) => void;
  isScrolling?: boolean;
}

const MessageRow = memo(({ style, group, onHeightChange, isScrolling }: MessageRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rowRef.current && onHeightChange) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = entry.borderBoxSize[0]?.blockSize || entry.contentRect.height;
          onHeightChange(Math.ceil(height));
        }
      });

      observer.observe(rowRef.current);
      return () => observer.disconnect();
    }
  }, [onHeightChange]);

  return (
    <div ref={rowRef} style={style} className="py-2">
      <div className="flex items-center justify-center mb-2">
        <div className="text-xs text-white/50 bg-chatgpt-secondary/30 px-2 py-1 rounded">
          {group.label} · {group.timestamp}
        </div>
      </div>
      <div className="space-y-2">
        {group.messages.map((message, idx) => (
          <Message 
            key={message.id || idx} 
            {...message} 
            showAvatar={idx === 0 || message.role !== group.messages[idx - 1].role}
          />
        ))}
      </div>
    </div>
  );
});

MessageRow.displayName = 'MessageRow';

export default MessageRow;