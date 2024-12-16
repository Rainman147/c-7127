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

  const startRecording = useCallback(async (stream: MediaStream) => {
    try {
      const mimeType = getMimeType();
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          onDataAvailable(e.data);
        }
      };

      mediaRecorder.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError(new Error('Recording failed'));
      };

      mediaRecorder.current.start(1000);
      setIsRecording(true);
      console.log('MediaRecorder started');
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
      mediaRecorder.current.stop();
      setIsRecording(false);
      console.log('MediaRecorder stopped');
    }
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};