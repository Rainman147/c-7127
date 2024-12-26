import { memo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { ConnectionStatus } from '../ConnectionStatus';
import { MessageGroup } from '../MessageGroup';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

interface ListContainerProps {
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
}: ListContainerProps) => {
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

  logger.debug(LogCategory.RENDER, 'ListContainer', 'Rendering message list:', {
    messageCount: messages.length,
    groupCount: messageGroups.length,
    viewportHeight
  });

  return (
    <div className="flex-1 overflow-hidden chat-scrollbar pb-[180px] pt-4 px-4">
      <ConnectionStatus />
      <List
        ref={listRef}
        height={listHeight || viewportHeight}
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
    </div>
  );
});

MessageListContainer.displayName = 'MessageListContainer';