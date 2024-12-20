import Message from './Message';
import { cn } from "@/lib/utils";

type Message = {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  type?: 'text' | 'audio';
};

const MessageList = ({ messages }: { messages: Message[] }) => {
  console.log('[MessageList] Rendering messages:', messages.map(m => ({
    role: m.role,
    id: m.id,
    contentPreview: m.content.substring(0, 50) + '...'
  })));
  
  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar">
      <div className={cn(
        "w-full max-w-3xl mx-auto px-4",
        "transition-all duration-300 ease-in-out transform"
      )}>
        {messages.map((message, index) => (
          <Message key={message.id || index} {...message} />
        ))}
      </div>
    </div>
  );
};

export default MessageList;