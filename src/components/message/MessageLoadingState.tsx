import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { logger, LogCategory } from '@/utils/logging';

interface MessageLoadingStateProps {
  message?: string;
  progress?: number;
  currentOperation?: string;
}

export const MessageLoadingState = ({ 
  message = 'Loading messages...', 
  progress,
  currentOperation 
}: MessageLoadingStateProps) => {
  logger.debug(LogCategory.RENDER, 'MessageLoadingState', 'Rendering loading state:', {
    message,
    progress,
    currentOperation,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-400">
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
      <div className="flex flex-col items-center space-y-2">
        <p className="text-sm">{message}</p>
        {currentOperation && (
          <p className="text-xs text-gray-500">{currentOperation}</p>
        )}
        {progress !== undefined && (
          <div className="w-48">
            <Progress value={progress} className="h-1" />
            <p className="text-xs text-center mt-1">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};