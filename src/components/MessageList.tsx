import { useRef, useEffect, useState, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useMessageState } from '@/hooks/chat/useMessageState';
import MessageRow from './message/MessageRow';
import { MessageLoadingState } from './message/MessageLoadingState';
import { MessageEmptyState } from './message/MessageEmptyState';
import { MessageListErrorBoundary } from './message/MessageListErrorBoundary';

const MIN_MESSAGE_HEIGHT = 60; // Minimum height for a message
const SCROLL_THRESHOLD = 100; // Pixels from bottom to trigger auto-scroll

const MessageList = ({ isLoading }: { isLoading?: boolean }) => {
  const renderStartTime = performance.now();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const sizeMap = useRef<{[key: number]: number}>({});
  const [isScrolling, setIsScrolling] = useState(false);
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const { messages } = useMessageState();
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastScrollTopRef = useRef(0);

  const getItemSize = useCallback((index: number) => {
    return sizeMap.current[index] || MIN_MESSAGE_HEIGHT;
  }, []);

  const setItemSize = useCallback((index: number, size: number) => {
    const hasChanged = sizeMap.current[index] !== size;
    if (hasChanged) {
      sizeMap.current[index] = Math.max(size, MIN_MESSAGE_HEIGHT);
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  }, []);

  const handleScroll = useCallback(({ scrollOffset, scrollDirection }) => {
    setIsScrolling(true);
    const isScrollingUp = scrollOffset < lastScrollTopRef.current;
    lastScrollTopRef.current = scrollOffset;

    if (isScrollingUp) {
      setShouldAutoScroll(false);
    }

    if (listRef.current) {
      const list = listRef.current as any;
      const isAtBottom = scrollOffset >= list._outerRef.scrollHeight - list._outerRef.clientHeight - SCROLL_THRESHOLD;
      if (isAtBottom) {
        setShouldAutoScroll(true);
      }
    }

    logger.debug(LogCategory.STATE, 'MessageList', 'Scroll event', {
      scrollOffset,
      scrollDirection,
      shouldAutoScroll
    });
  }, []);

  useEffect(() => {
    if (listRef.current && messages.length > 0 && shouldAutoScroll) {
      const scrollStartTime = performance.now();
      
      logger.debug(LogCategory.STATE, 'MessageList', 'Initiating scroll to bottom', {
        messageCount: messages.length,
        scrollStartTime,
        viewportHeight,
        keyboardVisible
      });
      
      try {
        listRef.current.scrollToItem(messages.length - 1, 'end');
        
        logger.debug(LogCategory.STATE, 'MessageList', 'Scroll complete', {
          duration: performance.now() - scrollStartTime
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
  }, [messages.length, viewportHeight, keyboardVisible, shouldAutoScroll]);

  if (isLoading) {
    return <MessageLoadingState />;
  }

  if (messages.length === 0) {
    return <MessageEmptyState />;
  }

  const messageGroups = groupMessages(messages);
  
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
      className="flex-1 overflow-hidden chat-scrollbar pb-[180px] pt-4 px-4"
    >
      <MessageListErrorBoundary>
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              height={height - 240}
              width={width}
              itemCount={messageGroups.length}
              itemSize={getItemSize}
              onScroll={handleScroll}
              onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
                logger.debug(LogCategory.STATE, 'MessageList', 'Visible items updated', {
                  visibleStartIndex,
                  visibleStopIndex,
                  totalItems: messageGroups.length
                });
              }}
            >
              {({ index, style }) => (
                <MessageRow 
                  style={style}
                  group={messageGroups[index]}
                  onHeightChange={(height) => setItemSize(index, height)}
                  isScrolling={isScrolling}
                />
              )}
            </List>
          )}
        </AutoSizer>
      </MessageListErrorBoundary>
    </div>
  );
};

export default MessageList;