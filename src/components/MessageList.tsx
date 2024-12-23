import { useRef, useEffect } from 'react';
import Message from './Message';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import type { Message as MessageType } from '@/types/chat';

const MessageList = ({ messages }: { messages: MessageType[] }) => {
  const renderStartTime = performance.now();
  const containerRef = useRef<HTMLDivElement>(null);
  
  logger.debug(LogCategory.RENDER, 'MessageList', 'Starting render:', { 
    messageCount: messages.length,
    renderStartTime
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      const scrollStartTime = performance.now();
      logger.debug(LogCategory.STATE, 'MessageList', 'Initiating scroll to bottom', {
        messageCount: messages.length,
        scrollStartTime
      });
      
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      
      logger.debug(LogCategory.STATE, 'MessageList', 'Scroll complete', {
        duration: performance.now() - scrollStartTime
      });
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="text-center text-white/70 mt-8">
        No messages yet. Start a conversation!
      </div>
    );
  }

  const messageGroups = groupMessages(messages);

  logger.debug(LogCategory.RENDER, 'MessageList', 'Render complete', {
    duration: performance.now() - renderStartTime,
    messageCount: messages.length,
    groupCount: messageGroups.length
  });

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto chat-scrollbar space-y-6 pb-[180px] pt-4 px-4"
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
                showAvatar={index === 0 || message.sender !== group.messages[index - 1].sender}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;