import { useRef, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import { logger, LogCategory } from '@/utils/logging';
import { useScrollManager } from '../useScrollManager';
import MessageRow from '../MessageRow';
import type { MessageGroup } from '@/types/chat';

interface MessageListVirtualizedProps {
  height: number;
  width: number;
  messageGroups: MessageGroup[];
}

export const MessageListVirtualized = ({ 
  height, 
  width, 
  messageGroups 
}: MessageListVirtualizedProps) => {
  const listRef = useRef<List>(null);
  const sizeMap = useRef<{[key: number]: number}>({});
  const [isScrolling, setIsScrolling] = useState(false);
  const { handleScroll, shouldAutoScroll } = useScrollManager(listRef);

  const getItemSize = (index: number) => {
    return sizeMap.current[index] || 60;
  };

  const setItemSize = (index: number, size: number) => {
    const hasChanged = sizeMap.current[index] !== size;
    if (hasChanged && listRef.current) {
      sizeMap.current[index] = Math.max(size, 60);
      listRef.current.resetAfterIndex(index);
    }
  };

  return (
    <List
      ref={listRef}
      height={height}
      width={width}
      itemCount={messageGroups.length}
      itemSize={getItemSize}
      onScroll={handleScroll}
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