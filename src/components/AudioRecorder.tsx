import { useState } from 'react';
import AudioControls from './AudioControls';
import { useRecording } from '@/hooks/transcription/useRecording';
import { useAudioProcessing } from '@/hooks/transcription/useAudioProcessing';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const AudioRecorder = ({ onTranscriptionComplete, onRecordingStateChange }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const handleError = (error: string) => {
    console.error('Audio processing error:', error);
    setIsRecording(false);
    onRecordingStateChange?.(false);
    toast({
      title: "Error",
      description: error,
      variant: "destructive"
    });
  };

  const handleTranscriptionSuccess = (text: string) => {
    console.log('Transcription completed successfully:', text);
    onTranscriptionComplete(text);
    setIsRecording(false);
    onRecordingStateChange?.(false);
  };

  const { startRecording: startRec, stopRecording: stopRec } = useRecording({
    onError: handleError,
    onTranscriptionComplete: handleTranscriptionSuccess
  });

  const { handleFileUpload } = useAudioProcessing({
    onTranscriptionComplete: handleTranscriptionSuccess,
    onError: handleError
  });

  const handleStartRecording = async () => {
    console.log('Starting recording...');
    setIsRecording(true);
    onRecordingStateChange?.(true);
    await startRec();
  };

  const handleStopRecording = async () => {
    console.log('Stopping recording...');
    await stopRec();
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