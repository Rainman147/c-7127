import { MessageGroup as MessageGroupType } from '@/utils/messageGrouping';
import Message from '../Message';

interface MessageGroupProps {
  group: MessageGroupType;
}

export const MessageGroup = ({ group }: MessageGroupProps) => {
  return (
    <div key={group.id} className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="text-xs text-white/50 bg-chatgpt-secondary/30 px-2 py-1 rounded">
          {group.label} · {group.timestamp}
        </div>
      </div>
      <div className="space-y-2">
        {group.messages.map((message, index) => (
          <Message 
            key={message.id || index} 
            {...message} 
            showAvatar={index === 0 || message.role !== group.messages[index - 1].role}
          />
        ))}
      </div>
    </div>
  );
};