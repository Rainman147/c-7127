import { useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useMessageState } from '@/hooks/chat/useMessageState';
import MessageRow from './message/MessageRow';
import { MessageLoadingState } from './message/MessageLoadingState';
import { MessageEmptyState } from './message/MessageEmptyState';

const ITEM_SIZE = 100; // Average height of a message item

const MessageList = ({ isLoading }: { isLoading?: boolean }) => {
  const renderStartTime = performance.now();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const lastScrollPosition = useRef<number>(0);
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const { messages } = useMessageState();
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentPosition = container.scrollTop;
      const scrollDelta = currentPosition - lastScrollPosition.current;
      
      logger.debug(LogCategory.STATE, 'MessageList', 'Scroll position changed', {
        previousPosition: lastScrollPosition.current,
        currentPosition,
        delta: scrollDelta,
        viewportHeight,
        keyboardVisible,
        messageCount: messages.length
      });
      
      lastScrollPosition.current = currentPosition;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length, viewportHeight, keyboardVisible]);

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      const scrollStartTime = performance.now();
      
      logger.debug(LogCategory.STATE, 'MessageList', 'Initiating scroll to bottom', {
        messageCount: messages.length,
        scrollStartTime,
        viewportHeight,
        keyboardVisible
      });
      
      try {
        listRef.current.scrollToItem(messages.length - 1);
        
        logger.debug(LogCategory.STATE, 'MessageList', 'Scroll complete', {
          duration: performance.now() - scrollStartTime
        });
      } catch (error) {
        logger.error(LogCategory.ERROR, 'MessageList', 'Scroll failed', {
          error,
          messageCount: messages.length,
          viewportHeight,
          keyboardVisible
        });
      }
    }
  }, [messages.length, viewportHeight, keyboardVisible]);

  if (isLoading) {
    return <MessageLoadingState />;
  }

  if (messages.length === 0) {
    return <MessageEmptyState />;
  }

  const messageGroups = groupMessages(messages);
  
  logger.debug(LogCategory.RENDER, 'MessageList', 'Render complete', {
    duration: performance.now() - renderStartTime,
    messageCount: messages.length,
    groupCount: messageGroups.length,
    viewportHeight,
    keyboardVisible
  });

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-hidden chat-scrollbar pb-[180px] pt-4 px-4"
    >
      <List
        ref={listRef}
        height={viewportHeight - 240}
        itemCount={messageGroups.length}
        itemSize={ITEM_SIZE}
        width="100%"
        className="chat-scrollbar"
      >
        {({ index, style }) => (
          <MessageRow 
            style={style}
            group={messageGroups[index]}
          />
        )}
      </List>
    </div>
  );
};

export default MessageList;