import { memo } from 'react';
import MessageContainer from './message/MessageContainer';
import { useMessageStateManager } from '@/hooks/message/useMessageStateManager';
import { useMessageRealtimeSync } from '@/hooks/message/useMessageRealtimeSync';
import { useMessageTypingEffect } from '@/hooks/message/useMessageTypingEffect';
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
    type,
    timestamp: new Date().toISOString()
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
  } = useMessageStateManager(content, id);

  const { connectionState } = useMessageRealtimeSync(
    id, 
    editedContent, 
    setEditedContent,
    `message-${id}` // Add unique componentId for this message instance
  );

  const { isTyping } = useMessageTypingEffect(role, isStreaming, content);

  // Enhanced connection state logging
  logger.debug(LogCategory.STATE, 'Message', 'Message state:', {
    id,
    isEditing,
    wasEdited,
    isSaving,
    connectionStatus: connectionState.status,
    isTyping,
    timestamp: new Date().toISOString()
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