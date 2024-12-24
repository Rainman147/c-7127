import { useRef, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';

interface MessageListContainerProps {
  children: React.ReactNode;
  isMounted: boolean;
  keyboardVisible: boolean;
}

const MessageListContainer = ({ children, isMounted, keyboardVisible }: MessageListContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialHeightSet = useRef(false);

  // Dedicated height calculation effect with fallback
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      logger.debug(LogCategory.STATE, 'MessageListContainer', 'Container not available for height calculation', {
        timestamp: new Date().toISOString()
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
          timestamp: new Date().toISOString()
        });
      }

      const newHeight = `calc(100vh - ${keyboardVisible ? '300px' : '240px'})`;
      container.style.height = newHeight;

      logger.debug(LogCategory.STATE, 'MessageListContainer', 'Height calculation complete', {
        duration: performance.now() - startTime,
        newHeight,
        keyboardVisible,
        containerClientHeight: container.clientHeight,
        containerScrollHeight: container.scrollHeight,
        hasScrollbar: container.scrollHeight > container.clientHeight,
        timestamp: new Date().toISOString()
      });
    };

    // Calculate height with requestAnimationFrame for smoother updates
    if (isMounted) {
      requestAnimationFrame(calculateHeight);
    }

    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [keyboardVisible, isMounted]);

  return (
    <div 
      ref={containerRef}
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
};

export default MessageListContainer;