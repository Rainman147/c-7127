import { useRef, useEffect, useState } from 'react';
import Message from './Message';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useScrollManager } from './message/ScrollManager';
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean;
}

const MessageList = ({ messages, isLoading = false }: MessageListProps) => {
  const renderStartTime = performance.now();
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const [isMounted, setIsMounted] = useState(false);
  const initialHeightSet = useRef(false);
  
  const { isNearBottom, metrics } = useScrollManager({
    containerRef,
    messages,
    isLoading,
    isMounted
  });

  // Track mount status with performance timing
  useEffect(() => {
    const mountPerformance = metrics.measureOperation('Component mounting');
    
    logger.debug(LogCategory.STATE, 'MessageList', 'Component mounting started', {
      timestamp: new Date().toISOString()
    });

    setIsMounted(true);

    return () => {
      const unmountDuration = mountPerformance.end();
      logger.debug(LogCategory.STATE, 'MessageList', 'Component unmounted', {
        unmountDuration,
        timestamp: new Date().toISOString()
      });
      setIsMounted(false);
    };
  }, [metrics]);

  // Monitor container dimensions with cleanup
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMounted) {
      logger.debug(LogCategory.STATE, 'MessageList', 'Container not ready for dimension monitoring', {
        isMounted,
        hasContainer: !!container,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        metrics.logMetrics('Container dimensions updated', {
          dimensions: entry.contentRect,
          keyboardVisible
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [messages.length, keyboardVisible, isMounted, metrics]);

  // Dedicated height calculation effect with fallback
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      logger.debug(LogCategory.STATE, 'MessageList', 'Container not available for height calculation', {
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
        logger.debug(LogCategory.STATE, 'MessageList', 'Initial fallback height set', {
          height: '100vh',
          timestamp: new Date().toISOString()
        });
      }

      const newHeight = `calc(100vh - ${keyboardVisible ? '300px' : '240px'})`;
      container.style.height = newHeight;

      logger.debug(LogCategory.STATE, 'MessageList', 'Height calculation complete', {
        duration: performance.now() - startTime,
        newHeight,
        keyboardVisible,
        containerClientHeight: container.clientHeight,
        containerScrollHeight: container.scrollHeight,
        messageCount: messages.length,
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
  }, [keyboardVisible, messages.length, isMounted]);

  // Message grouping with performance tracking
  const messageGroups = (() => {
    const groupStartTime = performance.now();
    const groups = groupMessages(messages);
    
    logger.debug(LogCategory.STATE, 'MessageList', 'Message grouping complete', {
      duration: performance.now() - groupStartTime,
      messageCount: messages.length,
      groupCount: groups.length,
      timestamp: new Date().toISOString()
    });
    
    return groups;
  })();

  if (messages.length === 0) {
    return (
      <div className="text-center text-white/70 mt-8">
        No messages yet. Start a conversation!
      </div>
    );
  }

  logger.debug(LogCategory.RENDER, 'MessageList', 'Render complete', {
    duration: performance.now() - renderStartTime,
    messageCount: messages.length,
    groupCount: messageGroups.length,
    viewportHeight,
    keyboardVisible,
    isNearBottom,
    isMounted,
    containerMetrics: containerRef.current ? metrics.logMetrics('Render metrics') : null,
    timestamp: new Date().toISOString()
  });

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
      {messageGroups.map((group) => (
        <div key={group.id} className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="text-xs text-white/50 bg-chatgpt-secondary/30 px-2 py-1 rounded">
              {group.label} · {group.timestamp}
            </div>
          </div>
          <div className="space-y-2">
            {group.messages.map((message, index) => (
              <Message 
                key={message.id || index} 
                {...message} 
                showAvatar={index === 0 || message.role !== group.messages[index - 1].role}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
