import MessageContentDisplay from './content/MessageContentDisplay';
import MessageEditor from './content/MessageEditor';
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
    <div 
      className={`${
        role === 'user' 
          ? 'flex justify-end w-full' 
          : 'w-full'
      }`}
    >
      <div 
        className={cn(
          role === 'user' 
            ? 'bg-[#3A3A3A] rounded-2xl px-4 py-3 max-w-[70%] sm:max-w-[90%] text-left' 
            : 'prose prose-invert max-w-none',
          isOptimistic && 'opacity-70',
          isFailed && 'border border-red-500'
        )}
      >
        {role === 'assistant' && id ? (
          <div>
            {isEditing ? (
              <MessageEditor
                content={content}
                messageId={id}
                isSaving={isSaving}
                onSave={onSave}
                onCancel={onCancel}
              />
            ) : (
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
            )}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default MessageContent;