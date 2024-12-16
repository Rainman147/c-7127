import { useState, useEffect } from 'react';
import AudioControls from './AudioControls';
import { useRecording } from '@/hooks/transcription/useRecording';
import { useAudioProcessing } from '@/hooks/transcription/useAudioProcessing';
import { useToast } from '@/hooks/use-toast';
import { getDeviceType, getBrowserType } from '@/utils/deviceDetection';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const AudioRecorder = ({ onTranscriptionComplete, onRecordingStateChange }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { isIOS } = getDeviceType();
  const { isSafari } = getBrowserType();

  useEffect(() => {
    // Check for microphone permission on mount
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          setHasPermission(result.state === 'granted');
          
          result.onchange = () => {
            setHasPermission(result.state === 'granted');
          };
        });
    }
  }, []);

  const handleError = (error: string) => {
    console.error('Audio processing error:', error);
    setIsRecording(false);
    onRecordingStateChange?.(false);

    if (error.includes('Permission denied')) {
      if (isIOS) {
        toast({
          title: "Microphone Access Required",
          description: "Please enable microphone access in your iOS Settings > Safari > Microphone",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to record audio",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
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
    if (isIOS && isSafari && !hasPermission) {
      toast({
        title: "Permission Required",
        description: "Tap the microphone button again to allow access",
        duration: 5000,
      });
    }

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