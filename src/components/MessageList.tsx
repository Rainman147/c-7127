import { memo, useEffect } from 'react';
import { ErrorTracker } from '@/utils/errorTracking';
import { useMessageListState } from './message/list/useMessageListState';
import { MessageListContainer } from './message/list/MessageListContainer';
import { PerformanceMonitor } from './message/PerformanceMonitor';
import { useRealTime } from '@/contexts/RealTimeContext';
import type { Message } from '@/types/chat';
import type { ErrorSeverity } from '@/types/errorTracking';

const MessageList = memo(({ messages: propMessages }: { messages: Message[] }) => {
  const { subscribeToChat, unsubscribeFromChat } = useRealTime();
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

  // Subscribe to chat updates when messages change - now with cleanup
  useEffect(() => {
    if (propMessages.length > 0) {
      const chatId = propMessages[0].id.split('-')[0];
      console.log('MessageList: Subscribing to chat:', chatId);
      
      if (chatId) {
        subscribeToChat(chatId);
        return () => {
          console.log('MessageList: Unsubscribing from chat:', chatId);
          unsubscribeFromChat(chatId);
        };
      }
    }
  }, [propMessages, subscribeToChat, unsubscribeFromChat]);

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
        setItemSize={(index: number, size: number) => {
          const groupId = messageGroups[index]?.id;
          if (groupId && sizeMap.current[groupId] !== size) {
            sizeMap.current[groupId] = size;
            if (listRef.current) {
              listRef.current.resetAfterIndex(index);
            }
          }
        }}
      />
    </>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;