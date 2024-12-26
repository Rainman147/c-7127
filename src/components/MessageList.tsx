import { memo, useEffect, useId } from 'react';
import { ErrorTracker } from '@/utils/errorTracking';
import { useMessageListState } from './message/list/useMessageListState';
import { MessageListContainer } from './message/list/MessageListContainer';
import { PerformanceMonitor } from './message/PerformanceMonitor';
import { useRealTime } from '@/contexts/RealTimeContext';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import type { ErrorSeverity } from '@/types/errorTracking';

const MessageList = memo(({ messages: propMessages }: { messages: Message[] }) => {
  const componentId = useId();
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

  useEffect(() => {
    let chatId: string | null = null;
    
    if (propMessages.length > 0) {
      chatId = propMessages[0].id.split('-')[0];
      
      logger.info(LogCategory.WEBSOCKET, 'MessageList', 'Initializing chat subscription', {
        chatId,
        componentId,
        messageCount: propMessages.length,
        timestamp: new Date().toISOString()
      });
      
      if (chatId) {
        subscribeToChat(chatId, componentId);
      }
    }

    return () => {
      if (chatId) {
        logger.info(LogCategory.WEBSOCKET, 'MessageList', 'Cleaning up chat subscription', {
          chatId,
          componentId,
          timestamp: new Date().toISOString()
        });
        
        unsubscribeFromChat(chatId, componentId);
      }
    };
  }, [propMessages, subscribeToChat, unsubscribeFromChat, componentId]);

  // Enhanced error tracking for duplicate messages with logging
  const lastMessage = propMessages[propMessages.length - 1];
  if (lastMessage && lastMessage.id === lastMessageRef.current) {
    const severity: ErrorSeverity = 'medium';
    const errorDetails = {
      component: 'MessageList',
      severity,
      errorType: 'data',
      timestamp: new Date().toISOString(),
      additionalInfo: {
        messageId: lastMessage.id,
        duplicateCount: propMessages.filter(m => m.id === lastMessage.id).length,
        renderedNodes: performanceMetrics.renderedNodes,
        componentId
      }
    };

    logger.error(LogCategory.STATE, 'MessageList', 'Duplicate message detected', errorDetails);
    ErrorTracker.trackError(new Error('Duplicate message detected'), errorDetails);
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