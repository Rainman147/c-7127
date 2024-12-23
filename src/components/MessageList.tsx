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

const MessageList = ({ messages }: { messages: Message[] }) => {
  logger.debug(LogCategory.RENDER, 'MessageList', 'Rendering messages:', 
    messages.map(m => ({
      role: m.role,
      id: m.id,
      contentPreview: m.content.substring(0, 50) + '...'
    }))
  );

  const listRef = useRef<List>(null);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      logger.debug(LogCategory.STATE, 'MessageList', 'Scrolling to bottom');
      listRef.current.scrollToItem(messages.length - 1);
    }
  }, [messages.length]);

  const Row = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const message = messages[index];
    logger.debug(LogCategory.RENDER, 'MessageList', 'Rendering row:', { index, messageId: message.id });
    
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

  return (
    <div className="flex-1 overflow-hidden pb-32">
      <List
        ref={listRef}
        height={600} // This will be overridden by CSS
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