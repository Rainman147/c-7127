import { useEffect, useState, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useScrollManager } from './message/ScrollManager';
import { useMessageListMetrics } from './message/useMessageListMetrics';
import MessageListContainer from './message/MessageListContainer';
import MessageGroups from './message/MessageGroups';
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean;
}

const MessageList = ({ messages, isLoading = false }: MessageListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const [isMounted, setIsMounted] = useState(false);
  const { metrics } = useMessageListMetrics(containerRef, isMounted, keyboardVisible);
  const prevMessagesLength = useRef<number>(0);
  
  // Enhanced mount status tracking with performance timing
  useEffect(() => {
    const mountPerformance = metrics.measureOperation('Component mounting');
    
    logger.debug(LogCategory.STATE, 'MessageList', 'Component mounting started', {
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      isLoading,
      keyboardVisible,
      containerExists: !!containerRef.current,
      containerDimensions: containerRef.current ? {
        scrollHeight: containerRef.current.scrollHeight,
        clientHeight: containerRef.current.clientHeight,
        scrollTop: containerRef.current.scrollTop
      } : null,
      viewportHeight
    });

    setIsMounted(true);

    return () => {
      const unmountDuration = mountPerformance.end();
      logger.debug(LogCategory.STATE, 'MessageList', 'Component unmounted', {
        unmountDuration,
        timestamp: new Date().toISOString(),
        finalMessageCount: messages.length,
        containerFinalState: containerRef.current ? {
          scrollHeight: containerRef.current.scrollHeight,
          clientHeight: containerRef.current.clientHeight,
          scrollTop: containerRef.current.scrollTop
        } : null
      });
      setIsMounted(false);
    };
  }, [metrics, messages.length, isLoading, keyboardVisible, viewportHeight]);

  // Track message count changes
  useEffect(() => {
    if (messages.length !== prevMessagesLength.current) {
      logger.debug(LogCategory.STATE, 'MessageList', 'Messages array changed', {
        previousCount: prevMessagesLength.current,
        newCount: messages.length,
        timestamp: new Date().toISOString(),
        isInitialLoad: prevMessagesLength.current === 0,
        containerState: containerRef.current ? {
          scrollHeight: containerRef.current.scrollHeight,
          clientHeight: containerRef.current.clientHeight,
          scrollTop: containerRef.current.scrollTop
        } : null
      });
      prevMessagesLength.current = messages.length;
    }
  }, [messages.length]);

  // Message grouping with enhanced performance tracking
  const messageGroups = (() => {
    const groupStartTime = performance.now();
    const groups = groupMessages(messages);
    
    logger.debug(LogCategory.STATE, 'MessageList', 'Message grouping complete', {
      duration: performance.now() - groupStartTime,
      messageCount: messages.length,
      groupCount: groups.length,
      timestamp: new Date().toISOString(),
      isLoading,
      isMounted,
      containerState: containerRef.current ? {
        scrollHeight: containerRef.current.scrollHeight,
        clientHeight: containerRef.current.clientHeight,
        scrollTop: containerRef.current.scrollTop
      } : null
    });
    
    return groups;
  })();

  if (messages.length === 0) {
    logger.debug(LogCategory.STATE, 'MessageList', 'No messages to display', {
      timestamp: new Date().toISOString(),
      containerExists: !!containerRef.current
    });
    return (
      <div className="text-center text-white/70 mt-8">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <MessageListContainer 
      ref={containerRef}
      isMounted={isMounted}
      keyboardVisible={keyboardVisible}
    >
      <MessageGroups groups={messageGroups} />
    </MessageListContainer>
  );
};

export default MessageList;