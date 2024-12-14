import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAudioContext } from '@/hooks/useAudioContext';
import { getMediaStream, cleanupMediaStream } from '@/utils/mediaStreamUtils';

interface AudioCaptureProps {
  onRecordingComplete: (blob: Blob) => void;
}

const AudioCapture = ({ onRecordingComplete }: AudioCaptureProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { initializeAudioContext, cleanupAudioContext } = useAudioContext();

  const startRecording = useCallback(async () => {
    try {
      const stream = await getMediaStream();
      const { source } = initializeAudioContext(stream);
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        chunks.current = [];
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      console.log('Started recording');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [initializeAudioContext, onRecordingComplete, toast]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }

    cleanupAudioContext();
    setIsRecording(false);
    console.log('Recording stopped');
  }, [cleanupAudioContext]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};

export default AudioCapture;