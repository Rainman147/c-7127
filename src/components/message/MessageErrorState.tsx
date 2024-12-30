import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger, LogCategory } from '@/utils/logging';

interface MessageErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const MessageErrorState = ({ error, onRetry }: MessageErrorStateProps) => {
  logger.debug(LogCategory.RENDER, 'MessageErrorState', 'Rendering error state:', {
    error,
    hasRetry: !!onRetry,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 text-red-400">
      <AlertCircle className="h-8 w-8" />
      <div className="text-center">
        <p className="font-medium">Error loading messages</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
};