import { useRef, useEffect } from 'react';
import Message from './Message';
import { logger, LogCategory } from '@/utils/logging';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  type?: 'text' | 'audio';
};

const MessageList = ({ messages }: { messages: Message[] }) => {
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

  logger.debug(LogCategory.RENDER, 'MessageList', 'Render complete', {
    duration: performance.now() - renderStartTime,
    messageCount: messages.length
  });

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto chat-scrollbar space-y-4 pb-[180px] pt-4 px-4"
    >
      {messages.map((message, index) => (
        <Message 
          key={message.id || index} 
          {...message} 
        />
      ))}
    </div>
  );
};

export default MessageList;