import { memo } from 'react';
import { ErrorTracker } from '@/utils/errorTracking';
import { useMessageListState } from './message/list/useMessageListState';
import { MessageListContainer } from './message/list/MessageListContainer';
import { PerformanceMonitor } from './message/PerformanceMonitor';
import type { Message } from '@/types/chat';
import type { ErrorSeverity } from '@/types/errorTracking';

const MessageList = memo(({ messages: propMessages }: { messages: Message[] }) => {
  const {
    containerRef,
    listRef,
    lastMessageRef,
    sizeMap,
    renderStartTime,
    viewportHeight,
    listHeight,
    messageGroups,
    performanceMetrics
  } = useMessageListState(propMessages);

  // Enhanced error tracking for duplicate messages
  const lastMessage = propMessages[propMessages.length - 1];
  if (lastMessage && lastMessage.id === lastMessageRef.current) {
    const severity: ErrorSeverity = 'medium';
    ErrorTracker.trackError(
      new Error('Duplicate message detected'),
      {
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
      }
    );
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
      <MessageListContainer
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