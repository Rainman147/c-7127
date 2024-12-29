import { memo } from 'react';
import Message from '../Message';
import type { MessageGroup } from '@/types/chat';

interface MessageRowProps {
  style: React.CSSProperties;
  group: MessageGroup;
}

const MessageRow = memo(({ style, group }: MessageRowProps) => {
  return (
    <div style={style} className="py-2">
      <div className="flex items-center justify-center mb-2">
        <div className="text-xs text-white/50 bg-chatgpt-secondary/30 px-2 py-1 rounded">
          {group.label} · {group.timestamp}
        </div>
      </div>
      <div className="space-y-2">
        {group.messages.map((message, idx) => (
          <Message 
            key={message.id || idx} 
            {...message} 
            showAvatar={idx === 0 || message.role !== group.messages[idx - 1].role}
          />
        ))}
      </div>
    </div>
  );
});

MessageRow.displayName = 'MessageRow';

export default MessageRow;