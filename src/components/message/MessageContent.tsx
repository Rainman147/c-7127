import { Loader2, Mic } from 'lucide-react';
import TiptapEditor from '../message-editor/TiptapEditor';

type MessageContentProps = {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'audio';
  isStreaming?: boolean;
  isEditing: boolean;
  id?: string;
  wasEdited: boolean;
  onSave: (newContent: string) => void;
  onCancel: () => void;
};

const MessageContent = ({ 
  role, 
  content, 
  type, 
  isStreaming, 
  isEditing,
  id,
  wasEdited,
  onSave,
  onCancel
}: MessageContentProps) => {
  console.log('[MessageContent] Rendering with:', { 
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
          : 'prose prose-invert max-w-none'
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
                editable={true}
              />
            </div>
          ) : (
            <>
              <div 
                className="text-gray-200"
                dangerouslySetInnerHTML={{ __html: content }}
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
        <div className="text-gray-200 whitespace-pre-wrap">{content}</div>
      )}
      {isStreaming && (
        <div className="inline-flex items-center gap-2 ml-2 text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Transcribing...</span>
        </div>
      )}
    </div>
  );
};

export default MessageContent;