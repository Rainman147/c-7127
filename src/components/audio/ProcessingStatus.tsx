import { memo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  progress: number;
  currentChunk?: number;
  totalChunks?: number;
}

const ProcessingStatus = memo(({
  progress,
  currentChunk,
  totalChunks
}: ProcessingStatusProps) => {
  return (
    <div className="flex items-center gap-4">
      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
      <div className="flex flex-col gap-1 min-w-[200px]">
        <Progress value={progress} className="h-2" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-500">
            Processing audio{currentChunk && totalChunks ? ` (${currentChunk}/${totalChunks})` : '...'}
          </span>
          {progress > 0 && (
            <span className="text-xs text-gray-500">
              {Math.round(progress)}% complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

ProcessingStatus.displayName = 'ProcessingStatus';

export default ProcessingStatus;