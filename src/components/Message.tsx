import { useState, useCallback, memo } from 'react';
import MessageAvatar from './MessageAvatar';
import MessageActions from './MessageActions';
import MessageContent from './message/MessageContent';
import { logger, LogCategory } from '@/utils/logging';

type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'text' | 'audio';
  id?: string;
};

const Message = memo(({ role, content, isStreaming, type, id }: MessageProps) => {
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [wasEdited, setWasEdited] = useState(false);

  logger.debug(LogCategory.RENDER, 'Message', 'Rendering message:', { 
    role, 
    id, 
    isEditing, 
    content: content.substring(0, 50) + '...',
    hasId: !!id 
  });

  const handleSave = useCallback((newContent: string) => {
    logger.info(LogCategory.STATE, 'Message', 'Saving edited content:', 
      { messageId: id, contentPreview: newContent.substring(0, 50) + '...' }
    );
    setEditedContent(newContent);
    setIsEditing(false);
    setWasEdited(true);
  }, [id]);

  const handleCancel = useCallback(() => {
    logger.info(LogCategory.STATE, 'Message', 'Canceling edit:', { messageId: id });
    setEditedContent(content);
    setIsEditing(false);
  }, [content]);

  const handleEdit = useCallback(() => {
    logger.info(LogCategory.STATE, 'Message', 'Starting edit for message:', { id });
    if (!id) {
      logger.error(LogCategory.ERROR, 'Message', 'Cannot edit message without ID');
      return;
    }
    setIsEditing(true);
  }, [id]);

  return (
    <div className="py-3">
      <div className={`flex gap-4 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
        <MessageAvatar isAssistant={role === 'assistant'} />
        <div className={`flex-1 space-y-2 ${role === 'user' ? 'flex flex-col items-end' : ''}`}>
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
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export default Message;