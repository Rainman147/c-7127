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

  const { handleScroll, shouldAutoScroll } = useScrollManager(listRef);

  const getItemSize = useCallback((index: number) => {
    logger.debug(LogCategory.STATE, 'MessageListContent', 'Getting item size', {
      index,
      cachedSize: sizeMap.current[index],
      defaultSize: MIN_MESSAGE_HEIGHT
    });
    return sizeMap.current[index] || MIN_MESSAGE_HEIGHT;
  }, []);

  const setItemSize = useCallback((index: number, size: number) => {
    const hasChanged = sizeMap.current[index] !== size;
    if (hasChanged) {
      logger.debug(LogCategory.STATE, 'MessageListContent', 'Updating item size', {
        index,
        oldSize: sizeMap.current[index],
        newSize: size
      });
      sizeMap.current[index] = Math.max(size, MIN_MESSAGE_HEIGHT);
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  }, []);

  // Reset measurements when messages change
  useEffect(() => {
    logger.debug(LogCategory.STATE, 'MessageListContent', 'Messages updated, resetting measurements', {
      messageCount: messages.length
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
      }
    }
  }, [messages, shouldAutoScroll]);

  const messageGroups = groupMessages(messages);

  logger.debug(LogCategory.RENDER, 'MessageListContent', 'Rendering message list', {
    messageCount: messages.length,
    groupCount: messageGroups.length,
    height,
    width,
    isScrolling,
    shouldAutoScroll
  });

  // Don't render if we don't have valid dimensions
  if (!height || !width) {
    logger.warn(LogCategory.RENDER, 'MessageListContent', 'Invalid dimensions, skipping render', {
      height,
      width
    });
    return null;
  }

  return (
    <List
      ref={listRef}
      height={height}
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
  );
};