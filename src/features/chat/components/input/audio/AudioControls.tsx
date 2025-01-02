import { memo } from 'react';
import { useAudioRecordingState } from '@/hooks/audio/useAudioRecordingState';
import { useRecordingHandler } from '@/hooks/audio/useRecordingHandler';
import RecordingControls from './RecordingControls';

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
  console.log('[AudioControls] Rendering with:', {
    isRecording,
    isProcessing,
    progress,
    currentChunk,
    totalChunks
  });

  const {
    isRecording: internalIsRecording,
    isProcessing: internalIsProcessing,
    progress: internalProgress,
    currentChunk: internalCurrentChunk,
    totalChunks: internalTotalChunks
  } = useAudioRecordingState();

  const { handleRecordingClick } = useRecordingHandler({
    isRecording,
    internalIsRecording,
    isProcessing,
    internalIsProcessing,
    onStartRecording,
    onStopRecording
  });

  const actualIsRecording = isRecording || internalIsRecording;
  const actualIsProcessing = isProcessing || internalIsProcessing;
  const actualProgress = progress || internalProgress;
  const actualCurrentChunk = currentChunk || internalCurrentChunk;
  const actualTotalChunks = totalChunks || internalTotalChunks;

  return (
    <RecordingControls
      isRecording={actualIsRecording}
      isProcessing={actualIsProcessing}
      progress={actualProgress}
      currentChunk={actualCurrentChunk}
      totalChunks={actualTotalChunks}
      onRecordingClick={handleRecordingClick}
    />
  );
});

AudioControls.displayName = 'AudioControls';

export default AudioControls;