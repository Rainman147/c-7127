import { useEffect } from 'react';
import MessageItem from './MessageItem';
import type { Message } from '@/types/chat';

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
        />
      ))}
    </div>
  );
};

export default MessageList;