import { memo } from 'react';
import MessageContainer from './message/MessageContainer';
import { useMessageState } from './message/useMessageState';
import { useMessageRealtime } from './message/useMessageRealtime';
import { useTypingEffect } from './message/useTypingEffect';
import type { MessageProps } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

const Message = memo(({ 
  role, 
  content, 
  isStreaming, 
  type, 
  id,
  showAvatar = true,
  isOptimistic,
  isFailed,
  created_at,
  status,
  onRetry 
}: MessageProps & {
  isOptimistic?: boolean;
  isFailed?: boolean;
  onRetry?: () => void;
}) => {
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

  useMessageRealtime(id, editedContent, setEditedContent);
  const { isTyping } = useTypingEffect(role, isStreaming, content);

  logger.debug(LogCategory.RENDER, 'Message', 'Rendering message:', {
    id,
    role,
    contentPreview: content?.substring(0, 50),
    isOptimistic,
    isFailed,
    wasEdited,
    isEditing,
    isTyping,
    created_at,
    status,
    renderStack: new Error().stack,
    renderTime: performance.now(),
    messageState: {
      editedContent: editedContent?.substring(0, 50),
      isEditing,
      wasEdited,
      isSaving
    }
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
      isOptimistic={isOptimistic}
      isFailed={isFailed}
      created_at={created_at}
      status={status}
      onSave={handleSave}
      onCancel={handleCancel}
      onEdit={handleEdit}
      onRetry={onRetry}
    />
  );
});

Message.displayName = 'Message';

export default Message;