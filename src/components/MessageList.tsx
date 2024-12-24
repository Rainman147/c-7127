import { useRef, useEffect } from 'react';
import Message from './Message';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useRealTime } from '@/contexts/RealTimeContext';
import type { Message as MessageType } from '@/types/chat';

const MessageList = ({ messages }: { messages: MessageType[] }) => {
  const renderStartTime = performance.now();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollPosition = useRef<number>(0);
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const { connectionState } = useRealTime();
  
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
        messageCount: messages.length,
        connectionState
      });
      
      lastScrollPosition.current = currentPosition;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length, viewportHeight, keyboardVisible, connectionState]);

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
        scrollHeight: containerRef.current.scrollHeight,
        connectionState
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

  // Track message grouping performance
  const messageGroups = (() => {
    const groupStartTime = performance.now();
    const groups = groupMessages(messages);
    
    logger.debug(LogCategory.RENDER, 'MessageList', 'Message grouping complete', {
      duration: performance.now() - groupStartTime,
      messageCount: messages.length,
      groupCount: groups.length,
      connectionState
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
    connectionState
  });

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto chat-scrollbar space-y-6 pb-[180px] pt-4 px-4"
    >
      {connectionState.status === 'connecting' && (
        <div className="text-center text-yellow-500 bg-yellow-500/10 py-2 rounded-md mb-4">
          Reconnecting to chat...
        </div>
      )}
      {connectionState.status === 'disconnected' && (
        <div className="text-center text-red-500 bg-red-500/10 py-2 rounded-md mb-4">
          Connection lost. Retrying...
        </div>
      )}
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