import { useState, useEffect } from 'react';
import AudioControls from './AudioControls';
import { useRecording } from '@/hooks/transcription/useRecording';
import { useAudioProcessing } from '@/hooks/transcription/useAudioProcessing';
import { useToast } from '@/hooks/use-toast';
import { getDeviceType, getBrowserType } from '@/utils/deviceDetection';
import { getNetworkInfo } from '@/utils/networkUtils';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const AudioRecorder = ({ onTranscriptionComplete, onRecordingStateChange }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [networkType, setNetworkType] = useState<string>('unknown');
  const { toast } = useToast();
  const { isIOS } = getDeviceType();
  const { isChrome, isSafari } = getBrowserType();

  useEffect(() => {
    // Check for microphone permission on mount
    const checkMicrophonePermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setHasPermission(result.state === 'granted');
        
        result.onchange = () => {
          setHasPermission(result.state === 'granted');
        };
      } catch (error) {
        console.error('Error checking microphone permission:', error);
        // On iOS, permissions API might not be available
        if (isIOS) {
          setHasPermission(null); // We'll handle iOS permissions differently
        }
      }
    };

    checkMicrophonePermission();

    // Monitor network conditions
    const checkNetwork = async () => {
      const network = await getNetworkInfo();
      setNetworkType(network.effectiveType);
      console.log('Current network conditions:', network);
    };

    checkNetwork();

    // Set up network change listener if supported
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', checkNetwork);
      return () => connection.removeEventListener('change', checkNetwork);
    }
  }, [isIOS]);

  const handleError = (error: string) => {
    console.error('Audio processing error:', error);
    setIsRecording(false);
    onRecordingStateChange?.(false);

    if (error.includes('Permission denied')) {
      if (isIOS) {
        toast({
          title: "Microphone Access Required",
          description: "Please enable microphone access in your iOS Settings > Safari > Microphone",
          variant: "destructive",
          duration: 5000
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
    if (!text || text.trim() === 'you' || text.trim().length < 2) {
      toast({
        title: "No Speech Detected",
        description: "Please try speaking more clearly or check your microphone",
        variant: "destructive"
      });
      return;
    }
    onTranscriptionComplete(text);
    setIsRecording(false);
    onRecordingStateChange?.(false);
  };

  const { startRecording: startRec, stopRecording: stopRec } = useRecording({
    onError: handleError,
    onTranscriptionComplete: handleTranscriptionSuccess,
    audioConfig: {
      sampleRate: isIOS ? 44100 : 16000, // iOS prefers 44.1kHz
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      // Chrome-specific settings
      ...(isChrome && {
        latencyHint: 'interactive',
        googEchoCancellation: true,
        googAutoGainControl: true,
        googNoiseSuppression: true,
        googHighpassFilter: true
      })
    }
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

    console.log('Starting recording with network type:', networkType);
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