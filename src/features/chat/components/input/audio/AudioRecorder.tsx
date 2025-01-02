import { memo } from 'react';
import AudioControls from '../../../audio/AudioControls';
import { useRecordingControls } from '@/hooks/audio/useRecordingControls';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const AudioRecorder = memo(({ 
  onTranscriptionComplete, 
  onRecordingStateChange 
}: AudioRecorderProps) => {
  const {
    isRecording,
    isProcessing,
    progress,
    currentChunk,
    totalChunks,
    startRecording,
    stopRecording
  } = useRecordingControls({
    onTranscriptionComplete,
    onRecordingStateChange
  });

  return (
    <AudioControls
      isRecording={isRecording}
      isInitializing={false}
      isProcessing={isProcessing}
      progress={progress}
      currentChunk={currentChunk}
      totalChunks={totalChunks}
      onStartRecording={startRecording}
      onStopRecording={stopRecording}
      onFileUpload={() => {}}
      onTranscriptionComplete={onTranscriptionComplete}
    />
  );
});

AudioRecorder.displayName = 'AudioRecorder';

export default AudioRecorder;