import { memo } from 'react';
import AudioControlButton from './audio/AudioControlButton';
import RecordingIndicator from './audio/RecordingIndicator';
import ProcessingIndicator from './ProcessingIndicator';

interface AudioControlsProps {
  isRecording: boolean;
  isInitializing: boolean;
  isProcessing: boolean;
  progress: number;
  currentChunk?: number;
  totalChunks?: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (file: File) => void;
  onTranscriptionComplete: (text: string) => void;
}

const AudioControls = memo(({
  isRecording,
  isInitializing,
  isProcessing,
  progress,
  currentChunk,
  totalChunks,
  onStartRecording,
  onStopRecording,
  onFileUpload,
  onTranscriptionComplete
}: AudioControlsProps) => {
  console.log('[AudioControls] Rendering with states:', { 
    isRecording, 
    isInitializing, 
    isProcessing, 
    progress, 
    currentChunk, 
    totalChunks 
  });

  const handleRecordingClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('[AudioControls] Record button clicked, current states:', { isRecording, isInitializing });
    
    if (isInitializing || isProcessing) {
      console.log('[AudioControls] Ignoring click while initializing or processing');
      return;
    }

    try {
      if (isRecording) {
        console.log('[AudioControls] Stopping recording...');
        await onStopRecording();
      } else {
        console.log('[AudioControls] Starting recording...');
        await onStartRecording();
      }
    } catch (error) {
      console.error('[AudioControls] Error handling recording:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <AudioControlButton
        isRecording={isRecording}
        isInitializing={isInitializing}
        isProcessing={isProcessing}
        onClick={handleRecordingClick}
      />
      {isRecording && <RecordingIndicator />}
      {isProcessing && (
        <ProcessingIndicator 
          progress={progress} 
          status={currentChunk && totalChunks ? `Processing chunk ${currentChunk} of ${totalChunks}...` : "Processing audio..."} 
          currentChunk={currentChunk}
          totalChunks={totalChunks}
        />
      )}
    </div>
  );
});

AudioControls.displayName = 'AudioControls';

export default AudioControls;