import { Loader2, Mic, AlertCircle } from 'lucide-react';
import type { MessageRole, MessageStatus } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

interface MessageContentDisplayProps {
  role: MessageRole;
  content: string;
  type?: 'text' | 'audio';
  isStreaming?: boolean;
  isTyping?: boolean;
  isOptimistic?: boolean;
  isFailed?: boolean;
  onRetry?: () => void;
}

const MessageContentDisplay = ({
  role,
  content,
  type,
  isStreaming,
  isTyping,
  isOptimistic,
  isFailed,
  onRetry
}: MessageContentDisplayProps) => {
  logger.debug(LogCategory.RENDER, 'MessageContentDisplay', 'Rendering content:', {
    role,
    contentPreview: content?.substring(0, 50),
    type,
    isStreaming,
    isTyping,
    isOptimistic,
    isFailed
  });

  return (
    <div className={`${role === 'user' ? 'text-gray-200' : 'prose prose-invert max-w-none'}`}>
      {type === 'audio' && (
        <span className="inline-flex items-center gap-2 mr-2 text-gray-400">
          <Mic className="h-4 w-4" />
        </span>
      )}
      <div 
        className="text-gray-200 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: content }}
      />
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
          <button
            onClick={onRetry}
            className="text-white hover:text-white hover:bg-red-500/20 px-2 py-1 rounded"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageContentDisplay;