import { useState } from 'react';
import AudioControls from './AudioControls';
import { useAudioProcessing } from '@/hooks/transcription/useAudioProcessing';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder = ({ onTranscriptionComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const { startRecording, stopRecording, handleFileUpload } = useAudioProcessing({
    onTranscriptionComplete,
    onError: (error) => {
      console.error('Audio processing error:', error);
      setIsRecording(false);
    }
  });

  const handleStartRecording = async () => {
    console.log('Starting recording...');
    setIsRecording(true);
    await startRecording();
  };

  const handleStopRecording = async () => {
    console.log('Stopping recording...');
    setIsRecording(false);
    await stopRecording();
  };

  return (
    <AudioControls
      isRecording={isRecording}
      onStartRecording={handleStartRecording}
      onStopRecording={handleStopRecording}
      onFileUpload={handleFileUpload}
      onTranscriptionComplete={onTranscriptionComplete}
    />
  );
};

export default AudioRecorder;