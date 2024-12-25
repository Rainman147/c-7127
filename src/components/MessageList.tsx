import { memo, useRef, useState, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useRealTime } from '@/contexts/RealTimeContext';
import { useScrollHandler } from './message/ScrollHandler';
import { useMessageGrouping } from '@/hooks/chat/useMessageGrouping';
import { usePerformanceMetrics } from '@/hooks/chat/usePerformanceMetrics';
import ListContainer from './message/ListContainer';
import { PerformanceMonitor } from './message/PerformanceMonitor';
import type { Message } from '@/types/chat';
import type { ErrorSeverity } from '@/types/errorTracking';

const MessageList = memo(({ messages: propMessages }: { messages: Message[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const lastMessageRef = useRef<string | null>(null);
  const sizeMap = useRef<{ [key: string]: number }>({});
  const renderStartTime = useRef(performance.now());
  
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const { connectionState } = useRealTime();
  const [listHeight, setListHeight] = useState(0);

  const messageGroups = useMessageGrouping(propMessages);
  const { metrics: scrollMetrics } = useScrollHandler({
    messages: propMessages,
    viewportHeight,
    keyboardVisible,
    connectionState,
    containerRef
  });
  const { metrics: performanceMetrics } = usePerformanceMetrics(
    propMessages?.length ?? 0,
    messageGroups?.length ?? 0
  );

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      setListHeight(height);
      
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'List height updated', {
        height,
        viewportHeight,
        keyboardVisible,
        renderedNodes: performanceMetrics.renderedNodes
      });
    }
  }, [viewportHeight, keyboardVisible, performanceMetrics.renderedNodes]);

  // Enhanced error tracking for duplicate messages
  const lastMessage = propMessages[propMessages.length - 1];
  if (lastMessage && lastMessage.id === lastMessageRef.current) {
    const severity: ErrorSeverity = 'medium';
    const metadata = {
      component: 'MessageList',
      severity,
      errorType: 'data',
      operation: 'message-deduplication',
      timestamp: new Date().toISOString(),
      additionalInfo: {
        messageId: lastMessage.id,
        duplicateCount: propMessages.filter(m => m.id === lastMessage.id).length,
        renderedNodes: performanceMetrics.renderedNodes
      }
    };

    ErrorTracker.trackError(new Error('Duplicate message detected'), metadata);
  } else if (lastMessage) {
    lastMessageRef.current = lastMessage.id;
  }

  const setItemSize = (index: number, size: number) => {
    const groupId = messageGroups[index]?.id;
    if (groupId && sizeMap.current[groupId] !== size) {
      sizeMap.current[groupId] = size;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  };

  return (
    <>
      <PerformanceMonitor
        messages={propMessages}
        messageGroups={messageGroups}
        performanceMetrics={performanceMetrics}
        renderStartTime={renderStartTime}
      />
      <ListContainer
        messages={propMessages}
        listHeight={listHeight}
        viewportHeight={viewportHeight}
        listRef={listRef}
        messageGroups={messageGroups}
        sizeMap={sizeMap}
        setItemSize={setItemSize}
      />
    </>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;