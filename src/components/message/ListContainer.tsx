import { memo, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import { ConnectionStatus } from './ConnectionStatus';
import { MessageGroup } from './MessageGroup';
import { logger, LogCategory } from '@/utils/logging';
import { useQueryClient } from '@tanstack/react-query';
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

const ListContainer = memo(({ 
  messages,
  listHeight,
  viewportHeight,
  listRef,
  messageGroups,
  sizeMap,
  setItemSize
}: ListContainerProps) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    logger.debug(LogCategory.RENDER, 'ListContainer', 'Messages updated:', {
      messageCount: messages.length,
      groupCount: messageGroups.length,
      timestamp: new Date().toISOString()
    });

    // Reset list measurements when messages change
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [messages.length, messageGroups.length, listRef]);

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
    viewportHeight,
    timestamp: new Date().toISOString()
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

ListContainer.displayName = 'ListContainer';

export default ListContainer;