import { Loader2, AlertCircle } from 'lucide-react';
import TiptapEditor from '../message-editor/TiptapEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MessageContentProps = {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'audio';
  isStreaming?: boolean;
  isEditing: boolean;
  id?: string;
  wasEdited: boolean;
  isSaving: boolean;
  isTyping: boolean;
  isOptimistic?: boolean;
  isFailed?: boolean;
  onSave: (newContent: string) => void;
  onCancel: () => void;
  onRetry?: () => void;
};

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
  console.log('[MessageContent] Rendering with:', { 
    role, 
    id, 
    isEditing,
    isTyping,
    isOptimistic,
    isFailed,
    hasContent: !!content,
    contentPreview: content.substring(0, 50) + '...'
  });

  // Loading state UI
  if (isOptimistic || isTyping) {
    return (
      <div className={cn(
        "flex flex-col gap-2 animate-pulse",
        role === 'user' ? 'items-end' : 'items-start'
      )}>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="flex items-center gap-2 text-gray-400 mt-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">
            {isOptimistic ? 'Sending...' : 'Typing...'}
          </span>
        </div>
      </div>
    );
  }

  // Error state UI
  if (isFailed) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to send message</span>
        </div>
        <div className="text-gray-400 bg-red-500/10 rounded-md p-3">
          {content}
        </div>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="self-start text-white hover:text-white hover:bg-red-500/20"
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  // Editor state
  if (isEditing && id) {
    return (
      <div>
        <TiptapEditor 
          content={content} 
          messageId={id}
          onSave={onSave}
          onCancel={onCancel}
          editable={!isSaving}
        />
        {isSaving && (
          <div className="flex items-center gap-2 mt-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving changes...</span>
          </div>
        )}
      </div>
    );
  }

  // Normal content display
  return (
    <div>
      <div 
        className="text-gray-200"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      {wasEdited && (
        <div className="text-xs text-gray-400 mt-1">
          (edited)
        </div>
      )}
    </div>
  );
};

export default MessageContent;