import { useCallback, useState } from 'react';
import { useMediaRecorder } from './recording/useMediaRecorder';
import { useAudioStream } from './recording/useAudioStream';

interface RecordingManagerProps {
  onRecordingComplete: (blob: Blob) => void;
  onAudioData?: (data: string) => void;
}

const RecordingManager = ({ 
  onRecordingComplete,
  onAudioData 
}: RecordingManagerProps) => {
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const { getStream, cleanupStream } = useAudioStream();

  const handleDataAvailable = useCallback((data: Blob) => {
    console.log('Recording chunk received, size:', data.size);
    onRecordingComplete(data);
  }, [onRecordingComplete]);

  const handleError = useCallback((error: Error) => {
    console.error('Recording error:', error);
    if (currentStream) {
      cleanupStream(currentStream);
      setCurrentStream(null);
    }
  }, [currentStream, cleanupStream]);

  const { isRecording, startRecording, stopRecording } = useMediaRecorder({
    onDataAvailable: handleDataAvailable,
    onError: handleError
  });

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await getStream();
      setCurrentStream(stream);
      await startRecording(stream);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [getStream, startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    if (currentStream) {
      cleanupStream(currentStream);
      setCurrentStream(null);
    }
  }, [stopRecording, currentStream, cleanupStream]);

  return {
    isRecording,
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    audioData: undefined // Maintained for backward compatibility
  };
};

export default RecordingManager;