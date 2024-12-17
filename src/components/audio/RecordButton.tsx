import { memo } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onClick: (event: React.MouseEvent) => void;
  className?: string;
}

const RecordButton = memo(({
  isRecording,
  isProcessing,
  onClick,
  className
}: RecordButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'relative h-9 w-9 p-0',
        isRecording && 'text-red-500 animate-pulse',
        isProcessing && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={isProcessing}
    >
      {isRecording ? (
        <Square className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
});

RecordButton.displayName = 'RecordButton';

export default RecordButton;