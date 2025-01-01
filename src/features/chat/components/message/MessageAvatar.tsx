import { User, Bot } from 'lucide-react';

interface MessageAvatarProps {
  isAIMessage: boolean;
}

const MessageAvatar = ({ isAIMessage }: MessageAvatarProps) => {
  return (
    <div className="w-8 h-8 rounded flex items-center justify-center">
      {isAIMessage ? (
        <Bot className="h-6 w-6 text-blue-500" />
      ) : (
        <User className="h-6 w-6 text-gray-400" />
      )}
    </div>
  );
};

export default MessageAvatar;