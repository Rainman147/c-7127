
import { Mic } from 'lucide-react';
import TiptapEditor from '@/features/chat/components/editor/TiptapEditor';
import MessageContent from './MessageContent';

type MessageItemProps = {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'audio';
  isEditing: boolean;
  id?: string;
  wasEdited: boolean;
  onSave: (newContent: string) => void;
  onCancel: () => void;
};

const MessageItem = ({ 
  role, 
  content, 
  type, 
  isEditing,
  id,
  wasEdited,
  onSave,
  onCancel
}: MessageItemProps) => {
  console.log('[MessageItem] Rendering with:', { 
    role, 
    id, 
    isEditing,
    hasContent: !!content,
    contentPreview: content.substring(0, 50) + '...'
  });
  
  return (
    <div 
      className={`${
        role === 'user' 
          ? 'bg-gray-700/50 rounded-[20px] px-4 py-2 inline-block' 
          : ''
      }`}
    >
      {type === 'audio' && (
        <span className="inline-flex items-center gap-2 mr-2 text-gray-400">
          <Mic className="h-4 w-4" />
        </span>
      )}
      {role === 'assistant' && id ? (
        <div>
          {isEditing ? (
            <div className="border border-[#10A37F] rounded-md p-4 bg-[#3A3A3A]">
              <TiptapEditor 
                content={content} 
                messageId={id}
                onSave={onSave}
                onCancel={onCancel}
                isEditable={true}
              />
            </div>
          ) : (
            <>
              <MessageContent 
                content={content} 
                type={type}
                isAssistant={role === 'assistant'}
              />
              {wasEdited && (
                <div className="text-xs text-gray-400 mt-1">
                  (edited)
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <MessageContent 
          content={content} 
          type={type}
          isAssistant={role === 'assistant'}
        />
      )}
    </div>
  );
};

export default MessageItem;
