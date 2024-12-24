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

    // Dedicated height calculation effect with fallback
    useEffect(() => {
      const container = ref && 'current' in ref ? ref.current : null;
      if (!container) {
        logger.debug(LogCategory.STATE, 'MessageListContainer', 'Container not available for height calculation', {
          timestamp: new Date().toISOString(),
          isMounted,
          keyboardVisible
        });
        return;
      }

      const calculateHeight = () => {
        const startTime = performance.now();
        // Set initial fallback height if not set
        if (!initialHeightSet.current) {
          container.style.height = '100vh';
          initialHeightSet.current = true;
          logger.debug(LogCategory.STATE, 'MessageListContainer', 'Initial fallback height set', {
            height: '100vh',
            timestamp: new Date().toISOString(),
            isMounted
          });
        }

        const newHeight = `calc(100vh - ${keyboardVisible ? '300px' : '240px'})`;
        
        // Only log if height actually changed
        if (newHeight !== lastHeight.current) {
          container.style.height = newHeight;
          lastHeight.current = newHeight;

          logger.debug(LogCategory.STATE, 'MessageListContainer', 'Height calculation complete', {
            duration: performance.now() - startTime,
            previousHeight: lastHeight.current,
            newHeight,
            keyboardVisible,
            containerClientHeight: container.clientHeight,
            containerScrollHeight: container.scrollHeight,
            hasScrollbar: container.scrollHeight > container.clientHeight,
            timestamp: new Date().toISOString(),
            isMounted
          });
        }
      };

      // Calculate height with requestAnimationFrame for smoother updates
      if (isMounted) {
        logger.debug(LogCategory.STATE, 'MessageListContainer', 'Requesting height calculation', {
          timestamp: new Date().toISOString(),
          isMounted,
          keyboardVisible
        });
        requestAnimationFrame(calculateHeight);
      }

      window.addEventListener('resize', calculateHeight);
      return () => window.removeEventListener('resize', calculateHeight);
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