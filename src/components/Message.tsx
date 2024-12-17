import MessageAvatar from './MessageAvatar';
import MessageActions from './MessageActions';
import { Loader2, Mic, Pencil } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [wasEdited, setWasEdited] = useState(false);

  const handleSave = (newContent: string) => {
    setEditedContent(newContent);
    setIsEditing(false);
    setWasEdited(true);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

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
              <div>
                {isEditing ? (
                  <div className="border border-[#10A37F] rounded-md p-4 bg-[#3A3A3A]">
                    <TiptapEditor 
                      content={editedContent} 
                      messageId={id}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      editable={true}
                    />
                  </div>
                ) : (
                  <>
                    <div className="text-gray-200 whitespace-pre-wrap">{editedContent}</div>
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
          {role === 'assistant' && (
            <MessageActions 
              content={editedContent} 
              onEdit={handleEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;