import { FixedSizeList as List } from 'react-window';
import { useRef, useCallback, useEffect } from 'react';
import Message from './Message';
import { logger, LogCategory } from '@/utils/logging';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  type?: 'text' | 'audio';
};

const ITEM_SIZE = 150; // Average height of a message
const OVERSCAN_COUNT = 5; // Number of items to render beyond visible area
const BOTTOM_PADDING = 180; // Increased padding to prevent overlap with input

const MessageList = ({ messages }: { messages: Message[] }) => {
  const renderStartTime = performance.now();
  
  logger.debug(LogCategory.RENDER, 'MessageList', 'Starting render:', { 
    messageCount: messages.length,
    renderStartTime
  });

  const listRef = useRef<List>(null);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      const scrollStartTime = performance.now();
      logger.debug(LogCategory.STATE, 'MessageList', 'Initiating scroll to bottom', {
        messageCount: messages.length,
        scrollStartTime
      });
      
      listRef.current.scrollToItem(messages.length - 1);
      
      logger.debug(LogCategory.STATE, 'MessageList', 'Scroll complete', {
        duration: performance.now() - scrollStartTime
      });
    }
  }, [messages.length]);

  const Row = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const rowRenderStart = performance.now();
    const message = messages[index];
    
    logger.debug(LogCategory.RENDER, 'MessageList', 'Rendering row:', { 
      index, 
      messageId: message.id,
      renderStartTime: rowRenderStart
    });
    
    return (
      <div style={style}>
        <Message key={message.id || index} {...message} />
      </div>
    );
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="text-center text-white/70 mt-8">
        No messages yet. Start a conversation!
      </div>
    );
  }

  logger.debug(LogCategory.RENDER, 'MessageList', 'Render complete', {
    duration: performance.now() - renderStartTime,
    messageCount: messages.length
  });

  return (
    <div className="flex-1 overflow-hidden" style={{ paddingBottom: BOTTOM_PADDING }}>
      <List
        ref={listRef}
        height={600}
        itemCount={messages.length}
        itemSize={ITEM_SIZE}
        width="100%"
        overscanCount={OVERSCAN_COUNT}
        className="chat-scrollbar"
      >
        {Row}
      </List>
    </div>
  );
};

export default MessageList;