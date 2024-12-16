import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMimeType } from '@/components/audio/recording/AudioConfigProvider';

interface MediaRecorderHookProps {
  onDataAvailable: (data: Blob) => void;
  onError: (error: Error) => void;
}

export const useMediaRecorder = ({ onDataAvailable, onError }: MediaRecorderHookProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();
  const CHUNK_DURATION = 5000; // 5 seconds

  const startRecording = useCallback(async (stream: MediaStream) => {
    try {
      const mimeType = getMimeType();
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log(`Audio chunk captured: ${e.data.size} bytes`);
          onDataAvailable(e.data);
        }
      };

      mediaRecorder.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError(new Error('Recording failed'));
      };

      mediaRecorder.current.start(CHUNK_DURATION);
      setIsRecording(true);
      console.log('MediaRecorder started with chunk duration:', CHUNK_DURATION);
    } catch (error) {
      console.error('Error starting MediaRecorder:', error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive"
      });
      onError(error as Error);
    }
  }, [onDataAvailable, onError, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      console.log('Stopping MediaRecorder and requesting final chunk');
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};