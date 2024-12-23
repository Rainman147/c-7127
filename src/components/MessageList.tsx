import { useRef, useEffect } from 'react';
import Message from './Message';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useScrollManager } from './message/ScrollManager';
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean;
}

const MessageList = ({ messages, isLoading = false }: MessageListProps) => {
  const renderStartTime = performance.now();
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  
  const { isNearBottom } = useScrollManager({
    containerRef,
    messages,
    isLoading
  });

  // Ensure container height is properly set
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.height = `calc(100vh - ${keyboardVisible ? '300px' : '240px'})`;
    }
  }, [keyboardVisible]);

  // Track message grouping performance
  const messageGroups = (() => {
    const groupStartTime = performance.now();
    const groups = groupMessages(messages);
    
    logger.debug(LogCategory.RENDER, 'MessageList', 'Message grouping complete', {
      duration: performance.now() - groupStartTime,
      messageCount: messages.length,
      groupCount: groups.length
    });
    
    return groups;
  })();

  if (messages.length === 0) {
    return (
      <div className="text-center text-white/70 mt-8">
        No messages yet. Start a conversation!
      </div>
    );
  }

  logger.debug(LogCategory.RENDER, 'MessageList', 'Render complete', {
    duration: performance.now() - renderStartTime,
    messageCount: messages.length,
    groupCount: messageGroups.length,
    viewportHeight,
    keyboardVisible,
    isNearBottom
  });

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto chat-scrollbar space-y-6 pb-[180px] pt-4 px-4"
      style={{ overscrollBehavior: 'contain' }}
    >
      {messageGroups.map((group) => (
        <div key={group.id} className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="text-xs text-white/50 bg-chatgpt-secondary/30 px-2 py-1 rounded">
              {group.label} · {group.timestamp}
            </div>
          </div>
          <div className="space-y-2">
            {group.messages.map((message, index) => (
              <Message 
                key={message.id || index} 
                {...message} 
                showAvatar={index === 0 || message.role !== group.messages[index - 1].role}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;