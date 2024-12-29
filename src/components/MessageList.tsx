import { useRef, useEffect } from 'react';
import Message from './Message';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import type { Message as MessageType } from '@/types/chat';
import { Loader2 } from 'lucide-react';

const MessageList = ({ messages, isLoading }: { messages: MessageType[], isLoading?: boolean }) => {
  const renderStartTime = performance.now();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollPosition = useRef<number>(0);
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  
  // Track scroll position changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentPosition = container.scrollTop;
      const scrollDelta = currentPosition - lastScrollPosition.current;
      
      logger.debug(LogCategory.STATE, 'MessageList', 'Scroll position changed', {
        previousPosition: lastScrollPosition.current,
        currentPosition,
        delta: scrollDelta,
        viewportHeight,
        keyboardVisible,
        messageCount: messages.length
      });
      
      lastScrollPosition.current = currentPosition;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length, viewportHeight, keyboardVisible]);

  // Enhanced scroll to bottom with performance tracking
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      const scrollStartTime = performance.now();
      
      logger.debug(LogCategory.STATE, 'MessageList', 'Initiating scroll to bottom', {
        messageCount: messages.length,
        scrollStartTime,
        viewportHeight,
        keyboardVisible,
        currentScrollPosition: containerRef.current.scrollTop,
        scrollHeight: containerRef.current.scrollHeight
      });
      
      try {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        
        logger.debug(LogCategory.STATE, 'MessageList', 'Scroll complete', {
          duration: performance.now() - scrollStartTime,
          finalScrollPosition: containerRef.current.scrollTop
        });
      } catch (error) {
        logger.error(LogCategory.ERROR, 'MessageList', 'Scroll failed', {
          error,
          messageCount: messages.length,
          viewportHeight,
          keyboardVisible
        });
      }
    }
  }, [messages.length, viewportHeight, keyboardVisible]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading messages...</p>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-lg mb-2">No messages yet</p>
        <p className="text-sm">Start a conversation to begin</p>
      </div>
    );
  }

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

  logger.debug(LogCategory.RENDER, 'MessageList', 'Render complete', {
    duration: performance.now() - renderStartTime,
    messageCount: messages.length,
    groupCount: messageGroups.length,
    viewportHeight,
    keyboardVisible
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