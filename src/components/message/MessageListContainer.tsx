import { useEffect, useRef } from 'react';
import MessageGroups from './MessageGroups';
import { useMessageListMetrics } from './useMessageListMetrics';
import type { MessageListContainerProps } from './types';
import { logger, LogCategory } from '@/utils/logging';

const MessageListContainer = ({ 
  messages,
  isLoading,
  mountResolution,
  onContainerMount,
  onMessagesLoad
}: MessageListContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { updateMetrics } = useMessageListMetrics();

  useEffect(() => {
    if (containerRef.current) {
      logger.debug(LogCategory.RENDER, 'MessageListContainer', 'Container mounted, updating metrics');
      updateMetrics(containerRef.current);
      onContainerMount?.();
    }
  }, [onContainerMount, updateMetrics]);

  useEffect(() => {
    if (messages.length > 0) {
      logger.debug(LogCategory.STATE, 'MessageListContainer', 'Messages loaded', { count: messages.length });
      onMessagesLoad?.();
    }
  }, [messages, onMessagesLoad]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col space-y-4 pb-[200px] pt-4"
    >
      <MessageGroups messages={messages} />
    </div>
  );
};

export default MessageListContainer;