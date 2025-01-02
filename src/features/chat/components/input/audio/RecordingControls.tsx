import { memo } from 'react';
import RecordButton from '@/components/audio/RecordButton';
import RecordingIndicator from '@/components/audio/RecordingIndicator';
import ProcessingStatus from '@/components/audio/ProcessingStatus';

interface RecordingControlsProps {
  isRecording: boolean;
  isProcessing: boolean;
  progress: number;
  currentChunk: number;
  totalChunks: number;
  onRecordingClick: (event: React.MouseEvent) => void;
}

const RecordingControls = memo(({
  isRecording,
  isProcessing,
  progress,
  currentChunk,
  totalChunks,
  onRecordingClick
}: RecordingControlsProps) => {
  return (
    <div className="flex items-center gap-2">
      <RecordButton
        isRecording={isRecording}
        isProcessing={isProcessing}
        onClick={onRecordingClick}
      />
      {isRecording && <RecordingIndicator />}
      {isProcessing && (
        <ProcessingStatus
          progress={progress}
          currentChunk={currentChunk}
          totalChunks={totalChunks}
        />
      )}
    </div>
  );
});

RecordingControls.displayName = 'RecordingControls';

export default RecordingControls;