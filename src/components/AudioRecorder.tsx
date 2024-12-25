import { memo } from 'react';
import { ErrorTracker } from "@/utils/errorTracking";
import type { ErrorMetadata } from "@/types/errorTracking";
import AudioControls from './AudioControls';
import { useRecordingControls } from '@/hooks/audio/useRecordingControls';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const AudioRecorder = memo(({ 
  onTranscriptionComplete, 
  onRecordingStateChange 
}: AudioRecorderProps) => {
  const handleError = (error: Error, operation: string, additionalInfo?: Record<string, unknown>) => {
    const metadata: ErrorMetadata = {
      component: 'AudioRecorder',
      severity: 'high',
      timestamp: new Date().toISOString(),
      errorType: 'recording',
      operation,
      additionalInfo: {
        errorMessage: error.message,
        ...additionalInfo
      }
    };
    ErrorTracker.trackError(error, metadata);
  };

  const {
    isRecording,
    isProcessing,
    progress,
    currentChunk,
    totalChunks,
    startRecording,
    stopRecording
  } = useRecordingControls({
    onTranscriptionComplete: (text: string) => {
      try {
        onTranscriptionComplete(text);
      } catch (error) {
        handleError(error as Error, 'transcription-complete', {
          textLength: text.length
        });
      }
    },
    onRecordingStateChange: (recording: boolean) => {
      try {
        onRecordingStateChange?.(recording);
      } catch (error) {
        handleError(error as Error, 'state-change', {
          newState: recording
        });
      }
    }
  });

  return (
    <AudioControls
      isRecording={isRecording}
      isInitializing={false}
      isProcessing={isProcessing}
      progress={progress}
      currentChunk={currentChunk}
      totalChunks={totalChunks}
      onStartRecording={async () => {
        try {
          await startRecording();
        } catch (error) {
          handleError(error as Error, 'start-recording');
        }
      }}
      onStopRecording={async () => {
        try {
          await stopRecording();
        } catch (error) {
          handleError(error as Error, 'stop-recording');
        }
      }}
      onFileUpload={() => {}}
      onTranscriptionComplete={onTranscriptionComplete}
    />
  );
});

AudioRecorder.displayName = 'AudioRecorder';

export default AudioRecorder;