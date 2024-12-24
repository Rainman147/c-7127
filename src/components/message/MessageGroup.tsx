import { memo, useEffect } from 'react';
import { type MessageGroup as MessageGroupType } from '@/utils/messageGrouping';
import Message from '../Message';
import { Tooltip } from '../ui/tooltip';
import { logger, LogCategory } from '@/utils/logging';

interface MessageGroupProps {
  group: MessageGroupType;
}

export const MessageGroup = memo(({ group }: MessageGroupProps) => {
  // Log render performance for each group
  useEffect(() => {
    const renderStart = performance.now();
    
    return () => {
      logger.debug(LogCategory.RENDER, 'MessageGroup', 'Group render complete', {
        groupId: group.id,
        messageCount: group.messages.length,
        renderDuration: performance.now() - renderStart,
        firstMessageId: group.messages[0]?.id,
        timestamp: new Date().toISOString()
      });
    };
  }, [group.id, group.messages]);

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
});

MessageGroup.displayName = 'MessageGroup';