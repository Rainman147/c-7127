
import { memo } from 'react';
import { cn } from '@/lib/utils';
import MessageAvatar from './MessageAvatar';
import MessageContent from './MessageContent';
import MessageActions from './MessageActions';
import type { Message as MessageType } from '@/types/chat';
import { Loader2 } from 'lucide-react';

interface MessageProps {
  message: MessageType;
}

const Message = ({ message }: MessageProps) => {
  console.log('[Message] Rendering message with role:', message.role);
  
  const isAssistant = message.role === 'assistant';
  const isStreaming = message.status === 'streaming';
  const isPending = message.status === 'pending';

  return (
    <div className={cn(
      "group relative px-4 py-6 text-gray-100",
      "transition-colors"
    )}>
      <div className={cn(
        "relative m-auto flex flex-col gap-4 px-4",
        "max-w-3xl",
        !isAssistant && "items-end"
      )}>
        <div className={cn(
          "flex gap-4 w-full",
          !isAssistant && "justify-end"
        )}>
          {isAssistant && <MessageAvatar role={message.role} />}
          <div className={cn(
            "space-y-4",
            isAssistant ? "flex-1" : "max-w-[80%] md:max-w-[80%] sm:max-w-[90%]"
          )}>
            <MessageContent content={message.content} type={message.type} isAssistant={isAssistant} />
            {(isStreaming || isPending) && (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{isStreaming ? "Streaming..." : "Pending..."}</span>
              </div>
            )}
          </div>
        </div>
        {isAssistant && message.status === 'delivered' && (
          <div className="ml-12 flex items-center space-x-2">
            <MessageActions content={message.content} isAssistant={isAssistant} />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(Message);
