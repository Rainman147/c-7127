import { memo } from 'react';
import { MessageListHeader } from './MessageListHeader';
import { MessageListContent } from './MessageListContent';
import { VariableSizeList as List } from 'react-window';
import type { Message } from '@/types/chat';

interface MessageListContainerProps {
  messages: Message[];
  listHeight: number;
  viewportHeight: number;
  listRef: React.RefObject<List>;
  messageGroups: any[];
  sizeMap: React.MutableRefObject<{ [key: string]: number }>;
  setItemSize: (index: number, size: number) => void;
}

export const MessageListContainer = memo(({ 
  messages,
  listHeight,
  viewportHeight,
  listRef,
  messageGroups,
  sizeMap,
  setItemSize
}: MessageListContainerProps) => {
  return (
    <div className="flex-1 overflow-hidden chat-scrollbar pb-[180px] pt-4 px-4">
      <MessageListHeader />
      <MessageListContent 
        messages={messages}
        listHeight={listHeight || viewportHeight}
        listRef={listRef}
        messageGroups={messageGroups}
        sizeMap={sizeMap}
        setItemSize={setItemSize}
      />
    </div>
  );
});

MessageListContainer.displayName = 'MessageListContainer';