import { memo } from 'react';
import Message from './Message';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  type?: 'text' | 'audio';
};

const MessageList = memo(({ messages }: { messages: Message[] }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[MessageList] Rendering messages:', messages.map(m => ({
      role: m.role,
      id: m.id,
      contentPreview: m.content.substring(0, 50) + '...'
    })));
  }
  
  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar">
      <div className="w-full max-w-3xl mx-auto px-4">
        {messages.map((message, index) => (
          <Message key={message.id || index} {...message} />
        ))}
      </div>
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;