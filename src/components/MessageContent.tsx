import { Loader2, AlertCircle, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageStatus } from '@/types/chat';
import { isMessageHistorical } from '@/utils/messageUtils';

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
  status?: MessageStatus;
  created_at?: string;
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
  status,
  created_at,
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
    status,
    created_at,
    hasContent: !!content,
    contentPreview: content.substring(0, 50) + '...'
  });

  const isHistorical = isMessageHistorical({ id, created_at } as any);

  const renderStatus = () => {
    // Don't show status indicators for historical messages
    if (isHistorical) return null;

    if (isOptimistic || status === 'queued' || status === 'sending') {
      return (
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>{status === 'queued' ? 'Queued...' : 'Sending...'}</span>
        </div>
      );
    }

    if (status === 'delivered') {
      return (
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Check className="h-3 w-3" />
          <span>Delivered</span>
        </div>
      );
    }

    if (status === 'seen') {
      return (
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <CheckCheck className="h-3 w-3" />
          <span>Seen</span>
        </div>
      );
    }

    if (isFailed || status === 'failed') {
      return (
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>Failed to send</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-white hover:text-white hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  // Only show loading state for non-historical messages
  if ((isOptimistic || isTyping) && !isHistorical) {
    return (
      <div className={cn(
        "flex flex-col gap-2 animate-pulse",
        role === 'user' ? 'items-end' : 'items-start'
      )}>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        {renderStatus()}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col gap-2",
      role === 'user' ? 'items-end' : 'items-start'
    )}>
      <div className={cn(
        "rounded-lg px-4 py-2",
        role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'
      )}>
        <div className="whitespace-pre-wrap">{content}</div>
        {wasEdited && (
          <div className="text-xs text-gray-400 mt-1">
            (edited)
          </div>
        )}
      </div>
      {renderStatus()}
    </div>
  );
};

export default MessageContent;