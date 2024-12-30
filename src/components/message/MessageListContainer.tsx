import { useRef, useEffect } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MessageListContent } from './MessageListContent';
import { MessageListErrorBoundary } from './MessageListErrorBoundary';
import { logger, LogCategory } from '@/utils/logging';

const MessageListContainer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());

  useEffect(() => {
    renderCountRef.current++;
    const mountTime = performance.now();
    
    logger.info(LogCategory.LIFECYCLE, 'MessageListContainer', 'Component mounted:', {
      renderCount: renderCountRef.current,
      containerDimensions: {
        height: containerRef.current?.clientHeight,
        scrollHeight: containerRef.current?.scrollHeight
      },
      timestamp: new Date().toISOString(),
      performance: {
        mountTime,
        timeSinceLastRender: mountTime - lastRenderTimeRef.current,
        heapSize: process.env.NODE_ENV === 'development' ? performance?.memory?.usedJSHeapSize : undefined
      }
    });

    return () => {
      logger.info(LogCategory.LIFECYCLE, 'MessageListContainer', 'Component will unmount:', {
        finalRenderCount: renderCountRef.current,
        timestamp: new Date().toISOString(),
        totalMountedDuration: performance.now() - mountTime
      });
    };
  }, []);

  logger.debug(LogCategory.RENDER, 'MessageListContainer', 'Rendering container:', {
    containerHeight: containerRef.current?.clientHeight,
    containerScrollHeight: containerRef.current?.scrollHeight,
    renderStack: new Error().stack,
    renderTime: performance.now(),
    timestamp: new Date().toISOString(),
    renderMetrics: {
      renderCount: renderCountRef.current,
      timeSinceLastRender: performance.now() - lastRenderTimeRef.current,
      containerState: {
        isVisible: containerRef.current?.offsetParent !== null,
        hasOverflow: containerRef.current ? 
          containerRef.current.scrollHeight > containerRef.current.clientHeight : false,
        scrollPosition: containerRef.current?.scrollTop
      }
    }
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
              timestamp: new Date().toISOString(),
              viewport: {
                windowInnerHeight: window.innerHeight,
                windowInnerWidth: window.innerWidth,
                devicePixelRatio: window.devicePixelRatio
              }
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