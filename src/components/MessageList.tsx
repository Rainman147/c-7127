import { useRef, useEffect, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useMessageState } from '@/hooks/chat/useMessageState';
import MessageRow from './message/MessageRow';
import { MessageLoadingState } from './message/MessageLoadingState';
import { MessageEmptyState } from './message/MessageEmptyState';

const MessageList = ({ isLoading }: { isLoading?: boolean }) => {
  const renderStartTime = performance.now();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const sizeMap = useRef<{[key: number]: number}>({});
  const [isScrolling, setIsScrolling] = useState(false);
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const { messages } = useMessageState();

  const getItemSize = (index: number) => {
    return sizeMap.current[index] || 100; // Default height
  };

  const setItemSize = (index: number, size: number) => {
    if (sizeMap.current[index] !== size) {
      sizeMap.current[index] = size;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  };

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
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
  }, [messages.length, viewportHeight, keyboardVisible]);

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
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height - 240}
            width={width}
            itemCount={messageGroups.length}
            itemSize={getItemSize}
            onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
              logger.debug(LogCategory.STATE, 'MessageList', 'Visible items updated', {
                visibleStartIndex,
                visibleStopIndex,
                totalItems: messageGroups.length
              });
            }}
            onScroll={({ scrollOffset, scrollDirection }) => {
              setIsScrolling(true);
              logger.debug(LogCategory.STATE, 'MessageList', 'Scroll event', {
                scrollOffset,
                scrollDirection
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
    </div>
  );
};

export default MessageList;