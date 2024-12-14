import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAudioContext } from '@/hooks/useAudioContext';
import { getMediaStream, cleanupMediaStream } from '@/utils/mediaStreamUtils';
import { RECORDER_OPTIONS } from '@/utils/audioConfig';
import { createAudioProcessingPipeline } from '@/utils/audioProcessing';

interface AudioCaptureProps {
  onAudioData: (data: string) => void;
  onRecordingComplete: (blob: Blob) => void;
}

const AudioCapture = ({ onAudioData, onRecordingComplete }: AudioCaptureProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { initializeAudioContext, cleanupAudioContext } = useAudioContext();

  const handleDataAvailable = useCallback((e: BlobEvent) => {
    if (e.data.size > 0) {
      chunks.current.push(e.data);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = (reader.result as string).split(',')[1];
        onAudioData(base64Audio);
      };
      reader.readAsDataURL(e.data);
    }
  }, [onAudioData]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await getMediaStream();
      const { source, processor } = initializeAudioContext(stream);
      
      // Explicitly cast source.context as AudioContext
      const pipeline = createAudioProcessingPipeline(source.context as AudioContext);
      pipeline.connectNodes(source);

      mediaRecorder.current = new MediaRecorder(stream, RECORDER_OPTIONS);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = handleDataAvailable;
      mediaRecorder.current.start(1000); // Record in 1-second chunks
      setIsRecording(true);

      console.log('Started recording with enhanced audio settings');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not access microphone",
        variant: "destructive"
      });
    }
  }, [initializeAudioContext, handleDataAvailable, toast]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording and cleaning up resources...');
    
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      cleanupMediaStream(mediaRecorder.current.stream);
    }

    cleanupAudioContext();
    setIsRecording(false);

    if (chunks.current.length > 0) {
      const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
      onRecordingComplete(audioBlob);
      chunks.current = [];
    }

    console.log('Recording stopped and audio resources cleaned up');
  }, [cleanupAudioContext, onRecordingComplete]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};

export default AudioCapture;