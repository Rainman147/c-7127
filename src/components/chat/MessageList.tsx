import Message from '@/features/chat/components/Message';
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
}

const MessageList = ({ messages }: MessageListProps) => {
  console.log('[MessageList] Rendering messages:', messages.map(m => ({
    role: m.role,
    id: m.id,
    contentPreview: m.content.substring(0, 50) + '...'
  })));
  
  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar">
      <div className="w-full max-w-3xl mx-auto px-4">
        {messages.map((message, index) => (
          <Message 
            key={message.id || index} 
            {...message} 
          />
        ))}
      </div>
    </div>
  );
};

export default MessageList;