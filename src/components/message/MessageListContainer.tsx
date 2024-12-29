import { useRef } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MessageListContent } from './MessageListContent';
import { MessageListErrorBoundary } from './MessageListErrorBoundary';

const MessageListContainer = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-hidden chat-scrollbar pb-[180px] pt-4 px-4"
    >
      <MessageListErrorBoundary>
        <AutoSizer>
          {({ height, width }) => (
            <MessageListContent 
              height={height - 240}
              width={width}
            />
          )}
        </AutoSizer>
      </MessageListErrorBoundary>
    </div>
  );
};

export default MessageListContainer;