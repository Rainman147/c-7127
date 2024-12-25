import { memo, useRef } from 'react';
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
  const recordingStartTime = useRef<number | null>(null);
  const audioFormat = useRef<string>('audio/webm');
  const currentChunkRef = useRef<number>(0);

  const handleError = (error: Error, operation: string, additionalInfo?: Record<string, unknown>) => {
    const audioDuration = recordingStartTime.current 
      ? Date.now() - recordingStartTime.current 
      : 0;

    const metadata: ErrorMetadata = {
      component: 'AudioRecorder',
      severity: 'high',
      timestamp: new Date().toISOString(),
      errorType: 'recording',
      operation,
      additionalInfo: {
        errorMessage: error.message,
        audioDuration,
        audioFormat: audioFormat.current,
        chunkIndex: currentChunkRef.current,
        totalChunks: totalChunks,
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
          textLength: text.length,
          processingDuration: recordingStartTime.current 
            ? Date.now() - recordingStartTime.current 
            : 0
        });
      }
    },
    onRecordingStateChange: (recording: boolean) => {
      try {
        if (recording) {
          recordingStartTime.current = Date.now();
        }
        onRecordingStateChange?.(recording);
      } catch (error) {
        handleError(error as Error, 'state-change', {
          newState: recording,
          recordingDuration: recordingStartTime.current 
            ? Date.now() - recordingStartTime.current 
            : 0
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
          recordingStartTime.current = Date.now();
          currentChunkRef.current = 0;
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