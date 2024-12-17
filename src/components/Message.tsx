import MessageAvatar from './MessageAvatar';
import MessageActions from './MessageActions';
import { Loader2, Mic } from 'lucide-react';
import TiptapEditor from './message-editor/TiptapEditor';
import { useState } from 'react';

type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'text' | 'audio';
  id?: string;
};

const Message = ({ role, content, isStreaming, type, id }: MessageProps) => {
  const [editedContent, setEditedContent] = useState(content);

  return (
    <div className="py-6">
      <div className={`flex gap-4 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
        <MessageAvatar isAssistant={role === 'assistant'} />
        <div className={`flex-1 space-y-2 ${role === 'user' ? 'flex justify-end' : ''}`}>
          <div 
            className={`${
              role === 'user' 
                ? 'bg-gray-700/50 rounded-[20px] px-4 py-2 inline-block' 
                : 'prose prose-invert max-w-none'
            }`}
          >
            {type === 'audio' && (
              <span className="inline-flex items-center gap-2 mr-2 text-gray-400">
                <Mic className="h-4 w-4" />
              </span>
            )}
            {role === 'assistant' && id ? (
              <div className="relative group">
                <TiptapEditor 
                  content={editedContent} 
                  messageId={id}
                  onSave={setEditedContent}
                />
                {/* Mobile hint */}
                <div className="absolute -top-6 left-0 text-xs text-gray-400 opacity-0 group-active:opacity-100 md:hidden">
                  Tap to edit
                </div>
                {/* Desktop hint */}
                <div className="absolute -top-6 left-0 text-xs text-gray-400 opacity-0 group-hover:opacity-100 hidden md:block">
                  Click to edit
                </div>
              </div>
            ) : (
              <div className="text-gray-200 whitespace-pre-wrap">{content}</div>
            )}
            {isStreaming && (
              <div className="inline-flex items-center gap-2 ml-2 text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Transcribing...</span>
              </div>
            )}
          </div>
          {role === 'assistant' && <MessageActions content={editedContent} />}
        </div>
      </div>
    </div>
  );
};

export default Message;