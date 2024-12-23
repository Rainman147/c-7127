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
  showAvatar?: boolean;
};

const Message = memo(({ 
  role, 
  content, 
  isStreaming, 
  type, 
  id,
  showAvatar = true 
}: MessageProps) => {
  const renderStartTime = performance.now();
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [wasEdited, setWasEdited] = useState(false);

  logger.debug(LogCategory.RENDER, 'Message', 'Starting message render:', { 
    role, 
    id,
    isEditing,
    contentLength: content.length,
    renderStartTime
  });

  const handleSave = useCallback((newContent: string) => {
    const saveStartTime = performance.now();
    logger.info(LogCategory.STATE, 'Message', 'Saving edited content:', { 
      messageId: id,
      contentLength: newContent.length,
      saveStartTime
    });
    
    setEditedContent(newContent);
    setIsEditing(false);
    setWasEdited(true);
    
    logger.debug(LogCategory.STATE, 'Message', 'Save complete', {
      duration: performance.now() - saveStartTime
    });
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

  logger.debug(LogCategory.RENDER, 'Message', 'Render complete', {
    duration: performance.now() - renderStartTime,
    messageId: id
  });

  return (
    <div className={`group transition-opacity duration-300 ${isStreaming ? 'opacity-70' : 'opacity-100'}`}>
      <div className={`flex gap-4 max-w-4xl mx-auto ${role === 'user' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 ${!showAvatar && 'invisible'}`}>
          <MessageAvatar isAssistant={role === 'assistant'} />
        </div>
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