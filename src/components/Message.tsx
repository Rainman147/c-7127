import { memo } from 'react';
import MessageContainer from './message/MessageContainer';
import { useMessageRealtime } from './message/useMessageRealtime';
import { useTypingEffect } from './message/useTypingEffect';
import { useMessages } from '@/contexts/MessageContext';
import { useMessageOperations } from '@/hooks/message/useMessageOperations';
import type { MessageProps } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

const Message = memo(({ 
  role, 
  content, 
  isStreaming, 
  type, 
  id,
  chat_id,
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
    updateMessageStatus,
    updateMessageContent,
    handleMessageEdit,
    handleMessageSave,
    handleMessageCancel
  } = useMessages();

  const { handleMessageEdit: editMessage } = useMessageOperations();

  const {
    editedContent,
    setEditedContent,
    isEditing,
    wasEdited,
    isSaving,
    setIsSaving
  } = useMessageRealtime(id, content, updateMessageContent);

  const { isTyping } = useTypingEffect(role, isStreaming, content);

  logger.debug(LogCategory.RENDER, 'Message', 'Rendering message:', {
    id,
    role,
    contentPreview: content?.substring(0, 50),
    isOptimistic,
    isFailed,
    wasEdited,
    isEditing,
    isTyping
  });

  const handleSave = async (newContent: string) => {
    setIsSaving(true);
    try {
      if (id) {
        await editMessage(id, newContent);
        await handleMessageSave(id, newContent);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    if (id) {
      handleMessageEdit(id);
    }
  };

  const handleCancel = () => {
    if (id) {
      handleMessageCancel(id);
    }
  };

  return (
    <MessageContainer
      role={role}
      content={content}
      isStreaming={isStreaming}
      type={type}
      id={id}
      chat_id={chat_id}
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