import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import type { Message as MessageType } from '@/types/chat';

interface MessageProps extends MessageType {
  wasEdited?: boolean;
  isEditing?: boolean;
  onSave?: (content: string) => void;
  onCancel?: () => void;
}

const MessageComponent = ({ 
  content, 
  sender,
  wasEdited = false,
  isEditing = false,
  onSave,
  onCancel
}: MessageProps) => {
  const isUser = sender === 'user';
  
  return (
    <div className={`py-8 px-4 ${isUser ? 'bg-transparent' : 'bg-chatgpt-secondary'}`}>
      <div className="flex gap-4 max-w-3xl mx-auto">
        <Avatar className="h-8 w-8">
          {isUser ? (
            <>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=default" />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </>
          ) : (
            <>
              <AvatarImage src="/bot-avatar.png" />
              <AvatarFallback>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </>
          )}
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="prose prose-invert max-w-none">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

const Message = memo(MessageComponent);
Message.displayName = 'Message';

export default Message;