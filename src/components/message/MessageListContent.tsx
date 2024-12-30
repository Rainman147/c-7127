import { useRef } from 'react';
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
  const messageGroups = groupMessages(messages);

  logger.debug(LogCategory.RENDER, 'MessageListContent', 'Rendering content:', {
    height,
    width,
    messageCount: messages.length,
    groupCount: messageGroups.length
  });

  if (!height || !width) {
    logger.warn(LogCategory.RENDER, 'MessageListContent', 'Invalid dimensions:', {
      height,
      width
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