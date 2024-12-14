import MessageAvatar from './MessageAvatar';
import MessageActions from './MessageActions';
import { Loader2 } from 'lucide-react';

type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
};

const Message = ({ role, content, isStreaming }: MessageProps) => {
  return (
    <div className="py-6">
      <div className={`flex gap-4 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
        <MessageAvatar isAssistant={role === 'assistant'} />
        <div className={`flex-1 space-y-2 ${role === 'user' ? 'flex justify-end' : ''}`}>
          <div 
            className={`${
              role === 'user' 
                ? 'bg-gray-700/50 rounded-[20px] px-4 py-2 inline-block' 
                : ''
            }`}
          >
            {content}
            {isStreaming && (
              <div className="inline-flex items-center gap-2 ml-2 text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Transcribing...</span>
              </div>
            )}
          </div>
          {role === 'assistant' && <MessageActions />}
        </div>
      </div>
    </div>
  );
};

export default Message;