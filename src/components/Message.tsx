import { useState } from 'react';
import MessageAvatar from './MessageAvatar';
import MessageActions from './MessageActions';
import MessageContent from './message/MessageContent';

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

  console.log('[Message] Rendering message with role:', role);

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
          <MessageContent 
            role={role}
            content={editedContent}
            type={type}
            isStreaming={isStreaming}
            isEditing={isEditing}
            id={id}
            wasEdited={wasEdited}
            onSave={handleSave}
            onCancel={handleCancel}
          />
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