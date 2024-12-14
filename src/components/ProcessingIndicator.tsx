import { Loader2 } from 'lucide-react';
import { Progress } from './ui/progress';

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
  return (
    <div className="flex items-center gap-4">
      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
      <div className="flex flex-col gap-1 min-w-[200px]">
        <Progress value={progress} className="h-2" />
        {status && (
          <span className="text-xs text-gray-500">{status}</span>
        )}
        {totalChunks > 1 && (
          <span className="text-xs text-gray-500">
            Processing chunk {currentChunk} of {totalChunks}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProcessingIndicator;