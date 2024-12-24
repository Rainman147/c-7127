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
  
  // Enhanced mount status tracking with detailed performance timing
  useEffect(() => {
    const mountPerformance = metrics.measureOperation('Component mounting');
    const mountTimestamp = new Date().toISOString();
    
    logger.debug(LogCategory.STATE, 'MessageList', 'Component mounting started', {
      timestamp: mountTimestamp,
      messageCount: messages.length,
      isLoading,
      keyboardVisible,
      containerExists: !!containerRef.current,
      containerDimensions: containerRef.current ? {
        scrollHeight: containerRef.current.scrollHeight,
        clientHeight: containerRef.current.clientHeight,
        scrollTop: containerRef.current.scrollTop,
        offsetHeight: containerRef.current.offsetHeight,
        offsetTop: containerRef.current.offsetTop
      } : null,
      viewportHeight,
      route: window.location.pathname,
      isMountedState: isMounted
    });

    setIsMounted(true);

    // Log after state update
    logger.debug(LogCategory.STATE, 'MessageList', 'Mount state updated', {
      timestamp: new Date().toISOString(),
      newMountedState: true,
      timeSinceMountStart: Date.now() - new Date(mountTimestamp).getTime()
    });

    return () => {
      const unmountDuration = mountPerformance.end();
      logger.debug(LogCategory.STATE, 'MessageList', 'Component unmounted', {
        unmountDuration,
        timestamp: new Date().toISOString(),
        finalMessageCount: messages.length,
        containerFinalState: containerRef.current ? {
          scrollHeight: containerRef.current.scrollHeight,
          clientHeight: containerRef.current.clientHeight,
          scrollTop: containerRef.current.scrollTop,
          offsetHeight: containerRef.current.offsetHeight,
          offsetTop: containerRef.current.offsetTop
        } : null,
        route: window.location.pathname
      });
      setIsMounted(false);
    };
  }, [metrics, messages.length, isLoading, keyboardVisible, viewportHeight]);

  // Enhanced message count change tracking
  useEffect(() => {
    if (messages.length !== prevMessagesLength.current) {
      logger.debug(LogCategory.STATE, 'MessageList', 'Messages array changed', {
        previousCount: prevMessagesLength.current,
        newCount: messages.length,
        timestamp: new Date().toISOString(),
        isInitialLoad: prevMessagesLength.current === 0,
        messageIds: messages.map(m => m.id),
        containerState: containerRef.current ? {
          scrollHeight: containerRef.current.scrollHeight,
          clientHeight: containerRef.current.clientHeight,
          scrollTop: containerRef.current.scrollTop,
          offsetHeight: containerRef.current.offsetHeight,
          scrollRatio: containerRef.current.scrollTop / containerRef.current.scrollHeight
        } : null,
        route: window.location.pathname
      });
      prevMessagesLength.current = messages.length;
    }
  }, [messages]);

  // Enhanced message grouping with detailed performance tracking
  const messageGroups = (() => {
    const groupStartTime = performance.now();
    const groups = groupMessages(messages);
    const groupingDuration = performance.now() - groupStartTime;
    
    logger.debug(LogCategory.STATE, 'MessageList', 'Message grouping complete', {
      duration: groupingDuration,
      messageCount: messages.length,
      groupCount: groups.length,
      timestamp: new Date().toISOString(),
      isLoading,
      isMounted,
      groupSizes: groups.map(g => g.messages.length),
      containerState: containerRef.current ? {
        scrollHeight: containerRef.current.scrollHeight,
        clientHeight: containerRef.current.clientHeight,
        scrollTop: containerRef.current.scrollTop,
        offsetHeight: containerRef.current.offsetHeight,
        visibleRatio: containerRef.current.clientHeight / containerRef.current.scrollHeight
      } : null,
      route: window.location.pathname
    });
    
    return groups;
  })();

  // Log container ref updates
  useEffect(() => {
    logger.debug(LogCategory.STATE, 'MessageList', 'Container ref status update', {
      timestamp: new Date().toISOString(),
      hasContainer: !!containerRef.current,
      containerDimensions: containerRef.current ? {
        scrollHeight: containerRef.current.scrollHeight,
        clientHeight: containerRef.current.clientHeight,
        scrollTop: containerRef.current.scrollTop,
        offsetHeight: containerRef.current.offsetHeight,
        offsetTop: containerRef.current.offsetTop
      } : null,
      route: window.location.pathname,
      isMounted
    });
  }, [containerRef.current, isMounted]);

  if (messages.length === 0) {
    logger.debug(LogCategory.STATE, 'MessageList', 'No messages to display', {
      timestamp: new Date().toISOString(),
      containerExists: !!containerRef.current,
      route: window.location.pathname
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