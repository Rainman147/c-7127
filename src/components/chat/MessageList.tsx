import { useEffect } from 'react';
import { Message } from '@/types/chat';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  onMessageClick?: (message: Message) => void;
}

const MessageList = ({ messages, onMessageClick }: MessageListProps) => {
  useEffect(() => {
    // Scroll to the bottom of the message list when new messages arrive
    const messageList = document.getElementById('message-list');
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [messages]);

  return (
    <div id="message-list" className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          role={message.role}
          content={message.content}
          type={message.type}
          id={message.id}
          wasEdited={false}
          isEditing={false}
          onSave={() => {}}
          onCancel={() => {}}
          onClick={() => onMessageClick?.(message)}
        />
      ))}
    </div>
  );
};

export default MessageList;