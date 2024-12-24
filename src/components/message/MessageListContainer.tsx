import { forwardRef, useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';

interface MessageListContainerProps {
  children: React.ReactNode;
  isMounted: boolean;
  keyboardVisible: boolean;
}

const MessageListContainer = forwardRef<HTMLDivElement, MessageListContainerProps>(
  ({ children, isMounted, keyboardVisible }, ref) => {
    const initialHeightSet = useRef(false);
    const lastHeight = useRef<string>('100vh');
    const resizeCount = useRef(0);
    const lastDimensions = useRef<any>(null);

    // Enhanced height calculation effect with detailed logging
    useEffect(() => {
      const container = ref && 'current' in ref ? ref.current : null;
      if (!container) {
        logger.debug(LogCategory.STATE, 'MessageListContainer', 'Container not available for height calculation', {
          timestamp: new Date().toISOString(),
          isMounted,
          keyboardVisible,
          initialHeightSet: initialHeightSet.current,
          lastHeight: lastHeight.current,
          resizeCount: resizeCount.current,
          route: window.location.pathname
        });
        return;
      }

      const calculateHeight = () => {
        const startTime = performance.now();
        resizeCount.current++;
        
        const currentDimensions = {
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          scrollTop: container.scrollTop,
          offsetHeight: container.offsetHeight,
          offsetTop: container.offsetTop,
          viewportHeight: window.innerHeight
        };

        // Log initial state
        logger.debug(LogCategory.STATE, 'MessageListContainer', 'Starting height calculation', {
          timestamp: new Date().toISOString(),
          resizeCount: resizeCount.current,
          initialHeightSet: initialHeightSet.current,
          currentHeight: container.style.height,
          lastHeight: lastHeight.current,
          dimensions: currentDimensions,
          dimensionsChanged: JSON.stringify(currentDimensions) !== JSON.stringify(lastDimensions.current),
          keyboardVisible,
          isMounted,
          route: window.location.pathname
        });

        // Set initial fallback height if not set
        if (!initialHeightSet.current) {
          container.style.height = '100vh';
          initialHeightSet.current = true;
          logger.debug(LogCategory.STATE, 'MessageListContainer', 'Initial fallback height set', {
            height: '100vh',
            timestamp: new Date().toISOString(),
            isMounted,
            dimensions: currentDimensions,
            route: window.location.pathname
          });
        }

        const newHeight = `calc(100vh - ${keyboardVisible ? '300px' : '240px'})`;
        
        // Log height change
        if (newHeight !== lastHeight.current) {
          const previousHeight = lastHeight.current;
          container.style.height = newHeight;
          lastHeight.current = newHeight;
          lastDimensions.current = currentDimensions;

          logger.debug(LogCategory.STATE, 'MessageListContainer', 'Height calculation complete', {
            duration: performance.now() - startTime,
            previousHeight,
            newHeight,
            keyboardVisible,
            dimensions: currentDimensions,
            hasScrollbar: container.scrollHeight > container.clientHeight,
            timestamp: new Date().toISOString(),
            isMounted,
            resizeCount: resizeCount.current,
            route: window.location.pathname
          });
        } else {
          logger.debug(LogCategory.STATE, 'MessageListContainer', 'Height unchanged', {
            duration: performance.now() - startTime,
            currentHeight: newHeight,
            keyboardVisible,
            dimensions: currentDimensions,
            timestamp: new Date().toISOString(),
            isMounted,
            resizeCount: resizeCount.current,
            route: window.location.pathname
          });
        }
      };

      // Calculate height with requestAnimationFrame for smoother updates
      if (isMounted) {
        logger.debug(LogCategory.STATE, 'MessageListContainer', 'Requesting height calculation', {
          timestamp: new Date().toISOString(),
          isMounted,
          keyboardVisible,
          resizeCount: resizeCount.current,
          route: window.location.pathname
        });
        requestAnimationFrame(calculateHeight);
      }

      const resizeObserver = new ResizeObserver((entries) => {
        logger.debug(LogCategory.STATE, 'MessageListContainer', 'Resize observed', {
          timestamp: new Date().toISOString(),
          dimensions: entries[0].contentRect,
          isMounted,
          route: window.location.pathname
        });
        calculateHeight();
      });

      resizeObserver.observe(container);
      
      return () => {
        resizeObserver.disconnect();
        logger.debug(LogCategory.STATE, 'MessageListContainer', 'Cleanup: ResizeObserver disconnected', {
          timestamp: new Date().toISOString(),
          route: window.location.pathname
        });
      };
    }, [keyboardVisible, isMounted, ref]);

    return (
      <div 
        ref={ref}
        className="flex-1 overflow-y-auto chat-scrollbar space-y-6 pb-[180px] pt-4 px-4"
        style={{ 
          overscrollBehavior: 'contain',
          willChange: 'transform',
          minHeight: '100px',
          height: '100vh' // Fallback height
        }}
      >
        {children}
      </div>
    );
  }
);

MessageListContainer.displayName = 'MessageListContainer';

export default MessageListContainer;