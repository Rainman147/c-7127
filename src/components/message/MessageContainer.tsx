import { memo } from 'react';
import MessageAvatar from '../MessageAvatar';
import MessageContent from './MessageContent';
import MessageActions from '../MessageActions';
import type { MessageProps } from './types';

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
            onSave={onSave}
            onCancel={onCancel}
            onRetry={onRetry}
          />
          {role === 'assistant' && id && (
            <MessageActions 
              content={editedContent}
              messageId={id}
              onEdit={onEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
});

MessageContainer.displayName = 'MessageContainer';

export default MessageContainer;