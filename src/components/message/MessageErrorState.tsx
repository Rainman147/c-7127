import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logger, LogCategory } from '@/utils/logging';

interface MessageErrorStateProps {
  error: string;
  onRetry?: () => void;
  errorDetails?: string;
}

export const MessageErrorState = ({ 
  error, 
  onRetry,
  errorDetails 
}: MessageErrorStateProps) => {
  logger.debug(LogCategory.RENDER, 'MessageErrorState', 'Rendering error state:', {
    error,
    hasRetry: !!onRetry,
    errorDetails,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto p-4">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Messages</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm">{error}</p>
          {errorDetails && (
            <p className="text-xs mt-1 text-gray-400">{errorDetails}</p>
          )}
        </AlertDescription>
      </Alert>
      
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};