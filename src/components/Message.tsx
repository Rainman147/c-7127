import { memo } from 'react';
import MessageContainer from './message/MessageContainer';
import { useMessageState } from './message/useMessageState';
import { useMessageRealtime } from './message/useMessageRealtime';
import { useTypingEffect } from './message/useTypingEffect';
import { logger, LogCategory } from '@/utils/logging';
import type { MessageProps } from './message/types';

const Message = memo(({ 
  role, 
  content, 
  isStreaming, 
  type, 
  id,
  showAvatar = true 
}: MessageProps) => {
  logger.debug(LogCategory.RENDER, 'Message', 'Rendering message:', {
    id,
    role,
    contentLength: content?.length,
    isStreaming,
    type
  });

  const {
    editedContent,
    setEditedContent,
    isEditing,
    wasEdited,
    isSaving,
    handleSave,
    handleCancel,
    handleEdit
  } = useMessageState(content, id);

  const { connectionStatus, lastUpdateTime } = useMessageRealtime(id, editedContent, setEditedContent);

  const { isTyping } = useTypingEffect(role, isStreaming, content);

  logger.debug(LogCategory.STATE, 'Message', 'Message state:', {
    id,
    isEditing,
    wasEdited,
    isSaving,
    connectionStatus,
    lastUpdateTime,
    isTyping
  });

  return (
    <MessageContainer
      role={role}
      content={content}
      isStreaming={isStreaming}
      type={type}
      id={id}
      showAvatar={showAvatar}
      editedContent={editedContent}
      isEditing={isEditing}
      wasEdited={wasEdited}
      isSaving={isSaving}
      isTyping={isTyping}
      onSave={handleSave}
      onCancel={handleCancel}
      onEdit={handleEdit}
    />
  );
});

Message.displayName = 'Message';

export default Message;