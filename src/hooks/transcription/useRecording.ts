import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RecordingOptions {
  onError: (error: string) => void;
}

export const useRecording = ({ onError }: RecordingOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        console.log('Recording stopped, blob created:', { size: audioBlob.size });
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      console.log('Started recording with enhanced audio settings');

    } catch (error: any) {
      console.error('Error starting recording:', error);
      onError("Could not access microphone. Please check permissions.");
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('Stopping recording...');
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};