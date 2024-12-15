import { useState } from 'react';
import AudioControls from './AudioControls';
import { useRecording } from '@/hooks/transcription/useRecording';
import { useAudioProcessing } from '@/hooks/transcription/useAudioProcessing';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  className?: string; // Added className prop
}

const AudioRecorder = ({ onTranscriptionComplete, className }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const handleError = (error: string) => {
    console.error('Audio processing error:', error);
    setIsRecording(false);
    toast({
      title: "Error",
      description: error,
      variant: "destructive"
    });
  };

  const { startRecording: startRec, stopRecording: stopRec } = useRecording({
    onError: handleError
  });

  const { handleFileUpload } = useAudioProcessing({
    onTranscriptionComplete,
    onError: handleError
  });

  const handleStartRecording = async () => {
    console.log('Starting recording...');
    setIsRecording(true);
    await startRec();
  };

  const handleStopRecording = async () => {
    console.log('Stopping recording...');
    setIsRecording(false);
    await stopRec();
  };

  return (
    <div className={className}>
      <AudioControls
        isRecording={isRecording}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onFileUpload={handleFileUpload}
        onTranscriptionComplete={onTranscriptionComplete}
      />
    </div>
  );
};

export default AudioRecorder;