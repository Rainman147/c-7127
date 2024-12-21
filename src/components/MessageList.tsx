import Message from './Message';

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
    <div className="flex-1 overflow-y-auto chat-scrollbar pb-32">
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-white/70 mt-8">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message, index) => (
            <Message key={message.id || index} {...message} />
          ))
        )}
      </div>
    </div>
  );
};

export default MessageList;