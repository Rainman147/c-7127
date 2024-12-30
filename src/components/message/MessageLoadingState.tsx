import { Loader2 } from 'lucide-react';
import { logger, LogCategory } from '@/utils/logging';

interface MessageLoadingStateProps {
  message?: string;
  progress?: number;
}

export const MessageLoadingState = ({ 
  message = 'Loading messages...', 
  progress 
}: MessageLoadingStateProps) => {
  logger.debug(LogCategory.RENDER, 'MessageLoadingState', 'Rendering loading state:', {
    message,
    progress,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-400">
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin" />
        {progress && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs">
            {Math.round(progress)}%
          </div>
        )}
      </div>
      <p>{message}</p>
    </div>
  );
};