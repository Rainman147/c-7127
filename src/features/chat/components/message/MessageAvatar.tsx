
import { User } from 'lucide-react';
import { MessageRole } from '@/types/chat';

interface MessageAvatarProps {
  role: MessageRole;
}

const MessageAvatar = ({ role }: MessageAvatarProps) => {
  console.log('[MessageAvatar] Rendering for role:', role);
  
  return (
    <div className="flex-shrink-0">
      {role === 'user' ? (
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      ) : (
        <div className="w-8 h-8 bg-[#0096FF] rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-white">SS</span>
        </div>
      )}
    </div>
  );
};

export default MessageAvatar;
