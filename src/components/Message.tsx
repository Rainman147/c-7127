import { memo } from 'react';
import MessageContainer from './message/MessageContainer';
import { useMessageState } from './message/useMessageState';
import { useMessageRealtime } from './message/useMessageRealtime';
import { useTypingEffect } from './message/useTypingEffect';
import type { MessageProps } from './message/types';
import { Loader2, AlertCircle } from 'lucide-react';

const Message = memo(({ 
  role, 
  content, 
  isStreaming, 
  type, 
  id,
  showAvatar = true,
  isOptimistic,
  isFailed 
}: MessageProps & {
  isOptimistic?: boolean;
  isFailed?: boolean;
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
      onSave={handleSave}
      onCancel={handleCancel}
      onEdit={handleEdit}
    />
  );
});

Message.displayName = 'Message';

export default Message;