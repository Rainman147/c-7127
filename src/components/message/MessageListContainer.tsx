import { useRef } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MessageListContent } from './MessageListContent';
import { MessageListErrorBoundary } from './MessageListErrorBoundary';
import { logger, LogCategory } from '@/utils/logging';

const MessageListContainer = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  logger.debug(LogCategory.RENDER, 'MessageListContainer', 'Rendering container:', {
    containerHeight: containerRef.current?.clientHeight,
    containerScrollHeight: containerRef.current?.scrollHeight,
    renderStack: new Error().stack,
    renderTime: performance.now()
  });

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-hidden chat-scrollbar pb-[180px] pt-4 px-4"
    >
      <MessageListErrorBoundary>
        <AutoSizer>
          {({ height, width }) => {
            logger.debug(LogCategory.RENDER, 'MessageListContainer', 'AutoSizer dimensions:', {
              height,
              width,
              renderTime: performance.now()
            });
            
            return (
              <MessageListContent 
                height={height - 240}
                width={width}
              />
            );
          }}
        </AutoSizer>
      </MessageListErrorBoundary>
    </div>
  );
};

export default MessageListContainer;