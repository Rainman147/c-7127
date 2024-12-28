import { memo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { MessageGroup } from '../MessageGroup';
import type { Message } from '@/types/chat';

interface MessageListContentProps {
  messages: Message[];
  listHeight: number;
  listRef: React.RefObject<List>;
  messageGroups: any[];
  sizeMap: React.MutableRefObject<{ [key: string]: number }>;
  setItemSize: (index: number, size: number) => void;
}

export const MessageListContent = memo(({ 
  messages,
  listHeight,
  listRef,
  messageGroups,
  sizeMap,
  setItemSize
}: MessageListContentProps) => {
  const getItemSize = (index: number) => {
    const groupId = messageGroups[index]?.id;
    return groupId ? sizeMap.current[groupId] || 100 : 100;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return (
      <div className="text-center text-white/70 mt-8">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <List
      ref={listRef}
      height={listHeight}
      itemCount={messageGroups.length}
      itemSize={getItemSize}
      width="100%"
      className="chat-scrollbar"
      overscanCount={2}
    >
      {({ index, style }) => (
        <div style={style}>
          <MessageGroup 
            key={messageGroups[index].id} 
            group={messageGroups[index]}
            onHeightChange={(height) => setItemSize(index, height)}
          />
        </div>
      )}
    </List>
  );
});

MessageListContent.displayName = 'MessageListContent';