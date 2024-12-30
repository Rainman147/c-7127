import { useRef, useEffect } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MessageListContent } from './MessageListContent';
import { MessageListErrorBoundary } from './MessageListErrorBoundary';
import { logger, LogCategory } from '@/utils/logging';

const MessageListContainer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;
    logger.debug(LogCategory.RENDER, 'MessageListContainer', 'Component mounted/updated:', {
      renderCount: renderCountRef.current,
      containerHeight: containerRef.current?.clientHeight,
      containerScrollHeight: containerRef.current?.scrollHeight,
      timestamp: new Date().toISOString()
    });

    return () => {
      logger.debug(LogCategory.RENDER, 'MessageListContainer', 'Component will unmount:', {
        finalRenderCount: renderCountRef.current,
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  logger.debug(LogCategory.RENDER, 'MessageListContainer', 'Rendering container:', {
    containerHeight: containerRef.current?.clientHeight,
    containerScrollHeight: containerRef.current?.scrollHeight,
    renderStack: new Error().stack,
    renderTime: performance.now(),
    timestamp: new Date().toISOString()
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
              renderTime: performance.now(),
              timestamp: new Date().toISOString()
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