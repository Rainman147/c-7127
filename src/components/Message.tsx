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

  console.log('[Message] Rendering message:', { 
    role, 
    id, 
    isEditing, 
    content: content.substring(0, 50) + '...',
    hasId: !!id 
  });

  const handleSave = (newContent: string) => {
    console.log('[Message] Saving edited content:', newContent.substring(0, 50) + '...');
    setEditedContent(newContent);
    setIsEditing(false);
    setWasEdited(true);
  };

  const handleCancel = () => {
    console.log('[Message] Canceling edit');
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleEdit = () => {
    console.log('[Message] Starting edit for message:', id);
    if (!id) {
      console.error('[Message] Cannot edit message without ID');
      return;
    }
    setIsEditing(true);
  };

  return (
    <div className={`message-container ${role}`}>
      <div className="message-content">
        {role === 'assistant' && <MessageAvatar isAssistant={true} />}
        <div className={`message-bubble ${role}`}>
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
          {role === 'assistant' && id && (
            <MessageActions 
              content={editedContent} 
              onEdit={handleEdit}
            />
          )}
        </div>
        {role === 'user' && <MessageAvatar isAssistant={false} />}
      </div>
    </div>
  );
};

export default Message;