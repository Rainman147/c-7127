import { useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useRealTime } from '@/contexts/RealTimeContext';
import { ConnectionStatus } from './message/ConnectionStatus';
import { MessageGroup } from './message/MessageGroup';
import { useScrollHandler } from './message/ScrollHandler';
import { useMessageGrouping } from '@/hooks/chat/useMessageGrouping';
import type { Message } from '@/types/chat';

const MessageList = ({ messages }: { messages: Message[] }) => {
  const renderStartTime = performance.now();
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const { connectionState } = useRealTime();
  
  const { metrics: scrollMetrics } = useScrollHandler({
    messages,
    viewportHeight,
    keyboardVisible,
    connectionState,
    containerRef
  });

  const messageGroups = useMessageGrouping(messages);

  // Log comprehensive render metrics
  logger.debug(LogCategory.RENDER, 'MessageList', 'Render metrics', {
    duration: performance.now() - renderStartTime,
    messageCount: messages?.length ?? 0,
    groupCount: messageGroups?.length ?? 0,
    scrollMetrics,
    viewportHeight,
    keyboardVisible,
    connectionState: connectionState?.toString() || 'unknown',
    timestamp: new Date().toISOString()
  });

  if (!Array.isArray(messages) || messages.length === 0) {
    return (
      <div className="text-center text-white/70 mt-8">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto chat-scrollbar space-y-6 pb-[180px] pt-4 px-4"
    >
      <ConnectionStatus />
      {messageGroups.map((group) => (
        <MessageGroup key={group.id} group={group} />
      ))}
    </div>
  );
};

export default MessageList;