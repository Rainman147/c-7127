import { memo } from 'react';
import MessageAvatar from '../MessageAvatar';
import MessageContent from './MessageContent';
import MessageActions from '../MessageActions';
import type { MessageProps } from './types';
import { logger, LogCategory } from '@/utils/logging';

const MessageContainer = memo(({ 
  role, 
  content, 
  isStreaming, 
  type, 
  id,
  showAvatar = true,
  editedContent,
  isEditing,
  wasEdited,
  isSaving,
  isTyping,
  isOptimistic,
  isFailed,
  created_at,
  status,
  onSave,
  onCancel,
  onEdit,
  onRetry
}: MessageProps & {
  editedContent: string;
  isEditing: boolean;
  wasEdited: boolean;
  isSaving: boolean;
  isTyping: boolean;
  isOptimistic?: boolean;
  isFailed?: boolean;
  onSave: (content: string) => void;
  onCancel: () => void;
  onEdit: () => void;
  onRetry?: () => void;
}) => {
  logger.debug(LogCategory.RENDER, 'MessageContainer', 'Rendering container:', {
    id,
    role,
    contentPreview: content?.substring(0, 50),
    editedContentPreview: editedContent?.substring(0, 50),
    messageState: {
      isEditing,
      wasEdited,
      isSaving,
      isTyping,
      isOptimistic,
      isFailed,
      created_at,
      status
    },
    renderStack: new Error().stack,
    renderTime: performance.now()
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
            isSaving={isSaving}
            isTyping={isTyping}
            isOptimistic={isOptimistic}
            isFailed={isFailed}
            created_at={created_at}
            status={status}
            onSave={onSave}
            onCancel={onCancel}
            onRetry={onRetry}
          />
          {role === 'assistant' && id && (
            <MessageActions 
              content={editedContent}
              messageId={id}
              onEdit={onEdit}
              onRetry={onRetry}
              isFailed={isFailed}
            />
          )}
        </div>
      </div>
    </div>
  );
});

MessageContainer.displayName = 'MessageContainer';

export default MessageContainer;