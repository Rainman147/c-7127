import { memo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecordingState } from '@/hooks/audio/useAudioRecordingState';
import { useAudioUpload } from '@/hooks/audio/useAudioUpload';
import { useRecordingSession } from '@/hooks/audio/useRecordingSession';
import RecordButton from './audio/RecordButton';
import ProcessingStatus from './audio/ProcessingStatus';
import RecordingIndicator from './audio/RecordingIndicator';

interface AudioControlsProps {
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
}

const AudioControls = memo(({
  onTranscriptionComplete,
  onTranscriptionUpdate
}: AudioControlsProps) => {
  const { toast } = useToast();
  const {
    isRecording,
    isProcessing,
    progress,
    currentChunk,
    totalChunks,
    updateState,
    resetState
  } = useAudioRecordingState();
  
  const { uploadAudioChunk } = useAudioUpload();
  const { createSession, clearSession, getSessionId } = useRecordingSession();

  const handleRecordingClick = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isProcessing) {
      console.log('Ignoring click while processing');
      return;
    }

    try {
      if (isRecording) {
        console.log('Stopping recording...');
        updateState({ isRecording: false, isProcessing: true });
        
        // Process recording logic here
        const sessionId = getSessionId();
        if (!sessionId) {
          throw new Error('No active recording session');
        }

        // Implement your recording stop logic here
        
        toast({
          title: "Recording Complete",
          description: "Processing your audio...",
          duration: 3000,
        });
      } else {
        console.log('Starting recording...');
        const sessionId = createSession();
        updateState({ isRecording: true });
        
        // Implement your recording start logic here
        
        toast({
          title: "Recording Started",
          description: "Recording session is now active",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error handling recording:', error);
      toast({
        title: "Recording Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      resetState();
      clearSession();
    }
  }, [isRecording, isProcessing, updateState, resetState, createSession, clearSession, getSessionId, toast]);

  return (
    <div className="flex items-center gap-2">
      <RecordButton
        isRecording={isRecording}
        isProcessing={isProcessing}
        onClick={handleRecordingClick}
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

AudioControls.displayName = 'AudioControls';

export default AudioControls;