import { useRef, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useRealTime } from '@/contexts/RealTimeContext';
import { ConnectionStatus } from './message/ConnectionStatus';
import { MessageGroup } from './message/MessageGroup';
import type { Message } from '@/types/chat';

const MessageList = ({ messages }: { messages: Message[] }) => {
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
        connectionState: connectionState.status
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
        connectionState: connectionState.status,
        retryCount: connectionState.retryCount
      });
      
      try {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        
        logger.debug(LogCategory.STATE, 'MessageList', 'Scroll complete', {
          duration: performance.now() - scrollStartTime,
          finalScrollPosition: containerRef.current.scrollTop,
          connectionState: connectionState.status
        });
      } catch (error) {
        logger.error(LogCategory.ERROR, 'MessageList', 'Scroll failed', {
          error,
          messageCount: messages.length,
          viewportHeight,
          keyboardVisible,
          connectionState: connectionState.status
        });
      }
    }
  }, [messages.length, viewportHeight, keyboardVisible, connectionState]);

  // Track message grouping performance
  const messageGroups = (() => {
    const groupStartTime = performance.now();
    const groups = groupMessages(messages);
    
    logger.debug(LogCategory.RENDER, 'MessageList', 'Message grouping complete', {
      duration: performance.now() - groupStartTime,
      messageCount: messages.length,
      groupCount: groups.length,
      connectionState: connectionState.status
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
    connectionState: connectionState.status,
    retryCount: connectionState.retryCount
  });

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