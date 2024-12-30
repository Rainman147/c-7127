import { memo, useEffect, useRef } from 'react';
import Message from '../Message';
import type { MessageGroup } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

interface MessageRowProps {
  style: React.CSSProperties;
  group: MessageGroup;
  onHeightChange?: (height: number) => void;
  isScrolling?: boolean;
}

const MessageRow = memo(({ style, group, onHeightChange, isScrolling }: MessageRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const measurementStartTime = useRef<number>();
  const lastMeasuredHeight = useRef<number>();

  useEffect(() => {
    if (rowRef.current && onHeightChange) {
      measurementStartTime.current = Date.now();
      
      logger.debug(LogCategory.STATE, 'MessageRow', 'Starting height measurement:', {
        groupId: group.label,
        messageCount: group.messages.length,
        messageIds: group.messages.map(m => m.id),
        messageDetails: group.messages.map(m => ({
          id: m.id,
          role: m.role,
          contentPreview: m.content?.substring(0, 50),
          status: m.status
        })),
        initialHeight: rowRef.current.offsetHeight,
        measurementStartTime: new Date(measurementStartTime.current).toISOString(),
        timestamp: new Date().toISOString()
      });

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = entry.borderBoxSize[0]?.blockSize || entry.contentRect.height;
          const measurementDuration = measurementStartTime.current 
            ? Date.now() - measurementStartTime.current 
            : 0;
          
          if (height !== lastMeasuredHeight.current) {
            logger.debug(LogCategory.STATE, 'MessageRow', 'Height changed:', {
              previousHeight: lastMeasuredHeight.current,
              newHeight: height,
              groupId: group.label,
              messageCount: group.messages.length,
              messageIds: group.messages.map(m => m.id),
              measurementDuration,
              hasImages: group.messages.some(m => m.content.includes('img')),
              timestamp: new Date().toISOString()
            });
            
            lastMeasuredHeight.current = height;
            onHeightChange(Math.ceil(height));
          }
        }
      });

      observer.observe(rowRef.current);
      return () => observer.disconnect();
    }
  }, [onHeightChange, group]);

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