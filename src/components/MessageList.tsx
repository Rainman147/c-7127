import { useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import Message from './Message';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useMessageState } from '@/hooks/chat/useMessageState';
import { Loader2 } from 'lucide-react';

const ITEM_SIZE = 100; // Average height of a message item

const MessageList = ({ isLoading }: { isLoading?: boolean }) => {
  const renderStartTime = performance.now();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const lastScrollPosition = useRef<number>(0);
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const { messages } = useMessageState();
  
  // Track scroll position changes
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

  // Scroll to bottom when new messages arrive
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading messages...</p>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-lg mb-2">No messages yet</p>
        <p className="text-sm">Start a conversation to begin</p>
      </div>
    );
  }

  const messageGroups = groupMessages(messages);
  
  logger.debug(LogCategory.RENDER, 'MessageList', 'Render complete', {
    duration: performance.now() - renderStartTime,
    messageCount: messages.length,
    groupCount: messageGroups.length,
    viewportHeight,
    keyboardVisible
  });

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const group = messageGroups[index];
    return (
      <div style={style} className="py-2">
        <div className="flex items-center justify-center mb-2">
          <div className="text-xs text-white/50 bg-chatgpt-secondary/30 px-2 py-1 rounded">
            {group.label} · {group.timestamp}
          </div>
        </div>
        <div className="space-y-2">
          {group.messages.map((message, idx) => (
            <Message 
              key={message.id || idx} 
              {...message} 
              showAvatar={idx === 0 || message.role !== group.messages[idx - 1].role}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-hidden chat-scrollbar pb-[180px] pt-4 px-4"
    >
      <List
        ref={listRef}
        height={viewportHeight - 240} // Account for header and input area
        itemCount={messageGroups.length}
        itemSize={ITEM_SIZE}
        width="100%"
        className="chat-scrollbar"
      >
        {Row}
      </List>
    </div>
  );
};

export default MessageList;