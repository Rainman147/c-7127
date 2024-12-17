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
  isRecording?: boolean;
  isInitializing?: boolean;
  isProcessing?: boolean;
  progress?: number;
  currentChunk?: number;
  totalChunks?: number;
  onStartRecording?: () => Promise<void>;
  onStopRecording?: () => Promise<void>;
  onFileUpload?: () => void;
}

const AudioControls = memo(({
  onTranscriptionComplete,
  onTranscriptionUpdate,
  isRecording = false,
  isInitializing = false,
  isProcessing = false,
  progress = 0,
  currentChunk = 0,
  totalChunks = 0,
  onStartRecording,
  onStopRecording,
  onFileUpload
}: AudioControlsProps) => {
  const { toast } = useToast();
  const {
    isRecording: internalIsRecording,
    isProcessing: internalIsProcessing,
    progress: internalProgress,
    currentChunk: internalCurrentChunk,
    totalChunks: internalTotalChunks,
    updateState,
    resetState
  } = useAudioRecordingState();
  
  const { uploadAudioChunk } = useAudioUpload();
  const { createSession, clearSession, getSessionId } = useRecordingSession();

  const handleRecordingClick = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const actualIsRecording = isRecording || internalIsRecording;
    const actualIsProcessing = isProcessing || internalIsProcessing;
    
    if (actualIsProcessing) {
      console.log('Ignoring click while processing');
      return;
    }

    try {
      if (actualIsRecording) {
        console.log('Stopping recording...');
        onStopRecording?.();
        updateState({ isRecording: false, isProcessing: true });
        
        const sessionId = getSessionId();
        if (!sessionId) {
          throw new Error('No active recording session');
        }
        
        toast({
          title: "Recording Complete",
          description: "Processing your audio...",
          duration: 3000,
        });
      } else {
        console.log('Starting recording...');
        const sessionId = createSession();
        updateState({ isRecording: true });
        onStartRecording?.();
        
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
  }, [isRecording, internalIsRecording, isProcessing, internalIsProcessing, updateState, resetState, createSession, clearSession, getSessionId, onStartRecording, onStopRecording, toast]);

  const actualIsRecording = isRecording || internalIsRecording;
  const actualIsProcessing = isProcessing || internalIsProcessing;
  const actualProgress = progress || internalProgress;
  const actualCurrentChunk = currentChunk || internalCurrentChunk;
  const actualTotalChunks = totalChunks || internalTotalChunks;

  return (
    <div className="flex items-center gap-2">
      <RecordButton
        isRecording={actualIsRecording}
        isProcessing={actualIsProcessing}
        onClick={handleRecordingClick}
      />
      {actualIsRecording && <RecordingIndicator />}
      {actualIsProcessing && (
        <ProcessingStatus
          progress={actualProgress}
          currentChunk={actualCurrentChunk}
          totalChunks={actualTotalChunks}
        />
      )}
    </div>
  );
});

AudioControls.displayName = 'AudioControls';

export default AudioControls;