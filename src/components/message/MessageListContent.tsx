import { useRef, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useMessageState } from '@/hooks/chat/useMessageState';
import { MessageListVirtualized } from './list/MessageListVirtualized';

interface MessageListContentProps {
  height: number;
  width: number;
}

export const MessageListContent = ({ height, width }: MessageListContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { messages } = useMessageState();
  const messageGroups = groupMessages(messages || []);
  const lastGroupCountRef = useRef(messageGroups.length);
  const lastRenderTimeRef = useRef(performance.now());

  useEffect(() => {
    const currentTime = performance.now();
    logger.debug(LogCategory.STATE, 'MessageListContent', 'Message groups updated:', {
      previousGroupCount: lastGroupCountRef.current,
      newGroupCount: messageGroups.length,
      messageCount: messages?.length || 0,
      timestamp: new Date().toISOString(),
      performance: {
        timeSinceLastRender: currentTime - lastRenderTimeRef.current,
        heapSize: process.env.NODE_ENV === 'development' && performance?.memory ? 
          performance.memory.usedJSHeapSize : undefined
      },
      groupingMetrics: {
        averageGroupSize: messages ? messages.length / messageGroups.length : 0,
        groupSizes: messageGroups.map(g => g.messages.length),
        timeRanges: messageGroups.map(g => ({
          label: g.label,
          messageCount: g.messages.length,
          firstMessageTime: g.messages[0]?.created_at,
          lastMessageTime: g.messages[g.messages.length - 1]?.created_at
        }))
      }
    });

    lastGroupCountRef.current = messageGroups.length;
    lastRenderTimeRef.current = currentTime;
  }, [messageGroups.length, messages]);

  if (!height || !width) {
    logger.warn(LogCategory.RENDER, 'MessageListContent', 'Invalid dimensions:', {
      height,
      width,
      timestamp: new Date().toISOString()
    });
    return null;
  }

  return (
    <div ref={containerRef} style={{ height, width }}>
      <MessageListVirtualized
        height={height}
        width={width}
        messageGroups={messageGroups}
      />
    </div>
  );
};