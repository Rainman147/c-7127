import React from 'react';
import { MessageContent } from './MessageContent';
import { MessageActions } from './MessageActions';
import { MessageAvatar } from './MessageAvatar';
import type { Message as MessageType } from '@/types/chat';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isAIMessage = message.role === 'assistant';
  
  return (
    <div className={`flex gap-4 p-4 ${isAIMessage ? 'bg-gray-50' : ''}`}>
      <MessageAvatar isAI={isAIMessage} />
      <div className="flex-1 space-y-2">
        <MessageContent content={message.content} type={message.type} />
        <MessageActions content={message.content} isAIMessage={isAIMessage} />
      </div>
    </div>
  );
};

export default Message;