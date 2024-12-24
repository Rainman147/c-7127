import Message from '../Message';
import type { MessageGroupsProps } from './types';

const MessageGroups = ({ messages }: MessageGroupsProps) => {
  return (
    <div className="space-y-2">
      {messages.map((message, index) => (
        <Message 
          key={message.id || index} 
          {...message} 
          showAvatar={index === 0 || message.role !== messages[index - 1]?.role}
        />
      ))}
    </div>
  );
};

export default MessageGroups;