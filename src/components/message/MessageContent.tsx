import { Loader2, Mic, AlertCircle } from 'lucide-react';
import TiptapEditor from '../message-editor/TiptapEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MessageContentProps } from '@/types/chat';

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
  created_at,
  status,
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
    created_at,
    status,
    hasContent: !!content,
    contentPreview: content?.substring(0, 50) + '...'
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
        {type === 'audio' && (
          <span className="inline-flex items-center gap-2 mr-2 text-gray-400">
            <Mic className="h-4 w-4" />
          </span>
        )}
        {role === 'assistant' && id ? (
          <div>
            {isEditing ? (
              <div className="border border-[#10A37F] rounded-md p-4 bg-[#3A3A3A]">
                <TiptapEditor 
                  content={content} 
                  messageId={id}
                  onSave={onSave}
                  onCancel={onCancel}
                  editable={!isSaving}
                />
                {isSaving && (
                  <div className="flex items-center justify-center mt-2 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving changes...
                  </div>
                )}
              </div>
            ) : (
              <>
                <div 
                  className="text-gray-200"
                  dangerouslySetInnerHTML={{ __html: content }}
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
          <div className="text-gray-200 whitespace-pre-wrap">{content}</div>
        )}
        {(isStreaming || isTyping) && role === 'assistant' && (
          <div className="inline-flex items-center gap-2 ml-2 text-gray-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">
              {isTyping ? 'Typing...' : 'Processing...'}
            </span>
          </div>
        )}
        {isOptimistic && (
          <div className="inline-flex items-center gap-2 ml-2 text-gray-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">Sending...</span>
          </div>
        )}
        {isFailed && onRetry && (
          <div className="flex items-center gap-2 mt-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to send</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="text-white hover:text-white hover:bg-red-500/20"
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageContent;