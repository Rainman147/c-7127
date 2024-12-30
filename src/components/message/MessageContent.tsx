import { cn } from '@/lib/utils';
import MessageContentWrapper from './content/MessageContentWrapper';
import type { MessageContentProps } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

const MessageContent = ({ 
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
  logger.debug(LogCategory.RENDER, 'MessageContent', 'Rendering with props:', {
    role,
    id,
    isEditing,
    isTyping,
    isOptimistic,
    isFailed,
    contentPreview: content?.substring(0, 50)
  });
  
  return (
    <div className={`${role === 'user' ? 'flex justify-end w-full' : 'w-full'}`}>
      <div 
        className={cn(
          role === 'user' 
            ? 'bg-[#3A3A3A] rounded-2xl px-4 py-3 max-w-[70%] sm:max-w-[90%] text-left' 
            : 'prose prose-invert max-w-none',
          isOptimistic && 'opacity-70',
          isFailed && 'border border-red-500'
        )}
      >
        <MessageContentWrapper
          role={role}
          content={content}
          type={type}
          isStreaming={isStreaming}
          isEditing={isEditing}
          id={id}
          wasEdited={wasEdited}
          isSaving={isSaving}
          isTyping={isTyping}
          isOptimistic={isOptimistic}
          isFailed={isFailed}
          onSave={onSave}
          onCancel={onCancel}
          onRetry={onRetry}
        />
      </div>
    </div>
  );
};

export default MessageContent;