import { type MessageGroup as MessageGroupType } from '@/utils/messageGrouping';
import Message from '../Message';
import { Tooltip } from '../ui/tooltip';
import { logger, LogCategory } from '@/utils/logging';

interface MessageGroupProps {
  group: MessageGroupType;
}

export const MessageGroup = ({ group }: MessageGroupProps) => {
  logger.debug(LogCategory.RENDER, 'MessageGroup', 'Rendering message group', {
    groupId: group.id,
    messageCount: group.messages.length,
    timestamp: group.timestamp
  });

  return (
    <div key={group.id} className="space-y-4">
      <div className="flex items-center justify-center">
        <Tooltip content={`Messages from ${group.label}`}>
          <div className="text-xs text-white/50 bg-chatgpt-secondary/30 px-2 py-1 rounded hover:bg-chatgpt-secondary/40 transition-colors cursor-help">
            {group.label}
          </div>
        </Tooltip>
      </div>
      <div className="space-y-2">
        {group.messages.map((message, index) => {
          const showAvatar = index === 0 || message.role !== group.messages[index - 1].role;
          
          logger.debug(LogCategory.RENDER, 'MessageGroup', 'Rendering message', {
            messageId: message.id,
            role: message.role,
            showAvatar,
            index
          });

          return (
            <Message 
              key={message.id || index} 
              {...message} 
              showAvatar={showAvatar}
            />
          );
        })}
      </div>
    </div>
  );
};