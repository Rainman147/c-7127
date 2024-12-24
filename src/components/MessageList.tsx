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
  
  const { isNearBottom } = useScrollManager({
    containerRef,
    messages,
    isLoading,
    isMounted
  });

  // Track mount status
  useEffect(() => {
    logger.debug(LogCategory.STATE, 'MessageList', 'Component mounted');
    setIsMounted(true);
    return () => {
      logger.debug(LogCategory.STATE, 'MessageList', 'Component unmounted');
      setIsMounted(false);
    };
  }, []);

  // Monitor container dimensions with cleanup
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMounted) {
      logger.debug(LogCategory.STATE, 'MessageList', 'Container not ready for dimension monitoring', {
        isMounted,
        hasContainer: !!container
      });
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        logger.debug(LogCategory.STATE, 'MessageList', 'Container dimensions updated', {
          height: entry.contentRect.height,
          width: entry.contentRect.width,
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          scrollTop: container.scrollTop,
          keyboardVisible,
          messageCount: messages.length,
          hasScrollbar: container.scrollHeight > container.clientHeight,
          computedStyle: {
            overflow: window.getComputedStyle(container).overflow,
            display: window.getComputedStyle(container).display,
            position: window.getComputedStyle(container).position,
          },
          timestamp: new Date().toISOString()
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [messages.length, keyboardVisible, isMounted]);

  // Dedicated height calculation effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMounted) {
      logger.debug(LogCategory.STATE, 'MessageList', 'Container not ready for height calculation', {
        isMounted,
        hasContainer: !!container
      });
      return;
    }

    const calculateHeight = () => {
      const fallbackHeight = '100vh';
      const newHeight = `calc(100vh - ${keyboardVisible ? '300px' : '240px'})`;
      
      // Set initial fallback height if needed
      if (!container.style.height) {
        container.style.height = fallbackHeight;
      }
      
      // Apply calculated height
      container.style.height = newHeight;
      
      logger.debug(LogCategory.STATE, 'MessageList', 'Container height calculated', {
        newHeight,
        keyboardVisible,
        containerClientHeight: container.clientHeight,
        containerScrollHeight: container.scrollHeight,
        messageCount: messages.length,
        scrollbarWidth: container.offsetWidth - container.clientWidth,
        hasVerticalScrollbar: container.scrollHeight > container.clientHeight,
        appliedClasses: container.className,
        computedOverflow: window.getComputedStyle(container).overflow,
        timestamp: new Date().toISOString()
      });
    };

    // Calculate height immediately and on resize
    calculateHeight();
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
    containerDimensions: containerRef.current ? {
      scrollHeight: containerRef.current.scrollHeight,
      clientHeight: containerRef.current.clientHeight,
      offsetHeight: containerRef.current.offsetHeight,
      scrollTop: containerRef.current.scrollTop,
    } : null,
    timestamp: new Date().toISOString()
  });

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto chat-scrollbar space-y-6 pb-[180px] pt-4 px-4"
      style={{ 
        overscrollBehavior: 'contain',
        willChange: 'transform',
        minHeight: '100px' // Fallback minimum height
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