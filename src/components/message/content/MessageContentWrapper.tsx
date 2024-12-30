import { memo } from 'react';
import MessageContentDisplay from './MessageContentDisplay';
import MessageEditor from './MessageEditor';
import type { MessageContentProps } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

const MessageContentWrapper = ({ 
  role, 
  content, 
  type, 
  isStreaming, 
  isEditing,
  id,
  wasEdited,
  isSaving,
  isTyping,
  isOptimistic,
  isFailed,
  onSave,
  onCancel,
  onRetry
}: MessageContentProps) => {
  logger.debug(LogCategory.RENDER, 'MessageContentWrapper', 'Rendering content wrapper:', {
    role,
    id,
    isEditing,
    isTyping,
    isOptimistic,
    isFailed
  });

  if (role === 'assistant' && id && isEditing) {
    return (
      <MessageEditor
        content={content}
        messageId={id}
        isSaving={isSaving}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  return (
    <>
      <MessageContentDisplay
        role={role}
        content={content}
        type={type}
        isStreaming={isStreaming}
        isTyping={isTyping}
        isOptimistic={isOptimistic}
        isFailed={isFailed}
        onRetry={onRetry}
      />
      {wasEdited && (
        <div className="text-xs text-gray-400 mt-1">
          (edited)
        </div>
      )}
    </>
  );
};

export default memo(MessageContentWrapper);