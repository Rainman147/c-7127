import { useRef, useState, useCallback, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useMessageState } from '@/hooks/chat/useMessageState';
import MessageRow from './MessageRow';
import { useScrollManager } from './useScrollManager';

const MIN_MESSAGE_HEIGHT = 60;

interface MessageListContentProps {
  height: number;
  width: number;
}

export const MessageListContent = ({ height, width }: MessageListContentProps) => {
  const listRef = useRef<List>(null);
  const sizeMap = useRef<{[key: number]: number}>({});
  const [isScrolling, setIsScrolling] = useState(false);
  const { messages } = useMessageState();
  const containerRef = useRef<HTMLDivElement>(null);

  const { handleScroll, shouldAutoScroll } = useScrollManager(listRef);

  // Debug viewport dimensions
  useEffect(() => {
    logger.debug(LogCategory.STATE, 'MessageListContent', 'Viewport dimensions:', {
      providedHeight: height,
      providedWidth: width,
      containerHeight: containerRef.current?.clientHeight,
      containerScrollHeight: containerRef.current?.scrollHeight,
      messageCount: messages.length,
      cachedSizes: Object.keys(sizeMap.current).length,
      timestamp: new Date().toISOString()
    });
  }, [height, width, messages.length]);

  const getItemSize = useCallback((index: number) => {
    const size = sizeMap.current[index] || MIN_MESSAGE_HEIGHT;
    logger.debug(LogCategory.STATE, 'MessageListContent', 'Getting item size:', {
      index,
      cachedSize: sizeMap.current[index],
      returnedSize: size,
      hasSize: !!sizeMap.current[index]
    });
    return size;
  }, []);

  const setItemSize = useCallback((index: number, size: number) => {
    const previousSize = sizeMap.current[index];
    const hasChanged = previousSize !== size;
    
    logger.debug(LogCategory.STATE, 'MessageListContent', 'Setting item size:', {
      index,
      previousSize,
      newSize: size,
      hasChanged,
      timestamp: new Date().toISOString()
    });

    if (hasChanged) {
      sizeMap.current[index] = Math.max(size, MIN_MESSAGE_HEIGHT);
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
        
        logger.debug(LogCategory.STATE, 'MessageListContent', 'Reset list after size change:', {
          index,
          newSize: sizeMap.current[index],
          totalCachedSizes: Object.keys(sizeMap.current).length
        });
      }
    }
  }, []);

  // Reset measurements when messages change
  useEffect(() => {
    logger.debug(LogCategory.STATE, 'MessageListContent', 'Messages updated, resetting measurements:', {
      messageCount: messages.length,
      previousCachedSizes: Object.keys(sizeMap.current).length,
      timestamp: new Date().toISOString()
    });
    
    // Clear size cache
    sizeMap.current = {};
    
    // Reset list measurements
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }

    // Scroll to bottom if needed
    if (shouldAutoScroll && listRef.current) {
      const list = listRef.current;
      const messageGroups = groupMessages(messages);
      if (messageGroups.length > 0) {
        list.scrollToItem(messageGroups.length - 1, 'end');
        
        logger.debug(LogCategory.STATE, 'MessageListContent', 'Scrolled to bottom:', {
          groupCount: messageGroups.length,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, [messages, shouldAutoScroll]);

  const messageGroups = groupMessages(messages);

  // Don't render if we don't have valid dimensions
  if (!height || !width) {
    logger.warn(LogCategory.RENDER, 'MessageListContent', 'Invalid dimensions, skipping render:', {
      height,
      width,
      timestamp: new Date().toISOString()
    });
    return null;
  }

  return (
    <div ref={containerRef} style={{ height, width }}>
      <List
        ref={listRef}
        height={height}
        width={width}
        itemCount={messageGroups.length}
        itemSize={getItemSize}
        onScroll={handleScroll}
        onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
          logger.debug(LogCategory.STATE, 'MessageListContent', 'Visible items updated:', {
            visibleStartIndex,
            visibleStopIndex,
            totalItems: messageGroups.length,
            containerHeight: containerRef.current?.clientHeight,
            timestamp: new Date().toISOString()
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
    </div>
  );
};