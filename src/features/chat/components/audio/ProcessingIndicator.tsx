import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProcessingIndicatorProps {
  progress: number;
  status: string;
  currentChunk?: number;
  totalChunks?: number;
}

const ProcessingIndicator = ({
  progress,
  status,
  currentChunk,
  totalChunks
}: ProcessingIndicatorProps) => {
  console.log('[ProcessingIndicator] Rendering with:', {
    progress,
    status,
    currentChunk,
    totalChunks
  });

  return (
    <div className="flex items-center gap-4">
      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
      <div className="flex flex-col gap-1 min-w-[200px]">
        <Progress value={progress} className="h-2" />
        <div className="flex flex-col gap-0.5">
          {status && (
            <span className="text-xs text-gray-500">{status}</span>
          )}
          {progress > 0 && progress < 100 && (
            <span className="text-xs text-gray-500">
              {Math.round(progress)}% complete
            </span>
          )}
          {currentChunk && totalChunks && totalChunks > 1 && (
            <span className="text-xs text-gray-500">
              Processing chunk {currentChunk} of {totalChunks}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingIndicator;