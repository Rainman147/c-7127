import { User, Bot } from "lucide-react";

interface MessageAvatarProps {
  isAIMessage: boolean;
}

const MessageAvatar = ({ isAIMessage }: MessageAvatarProps) => {
  console.log('[MessageAvatar] Rendering for role:', isAIMessage ? 'assistant' : 'user');
  
  return (
    <div className="flex-shrink-0">
      {!isAIMessage ? (
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      ) : (
        <div className="w-8 h-8 bg-[#10A37F] rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default MessageAvatar;