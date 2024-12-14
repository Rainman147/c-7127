import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createAudioProcessingPipeline } from '@/utils/audioProcessing';

interface AudioCaptureProps {
  onAudioData: (data: string) => void;
  onRecordingComplete: (blob: Blob) => void;
}

const AudioCapture = ({ onAudioData, onRecordingComplete }: AudioCaptureProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const processor = useRef<ScriptProcessorNode | null>(null);
  const chunks = useRef<Blob[]>([]);
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

      console.log('Microphone access granted, initializing audio context...');
      audioContext.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.current.createMediaStreamSource(stream);
      processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

      const pipeline = createAudioProcessingPipeline(audioContext.current);
      pipeline.connectNodes(source);

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
          // Convert blob to base64 and send to transcription
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            onAudioData(base64Audio);
          };
          reader.readAsDataURL(e.data);
        }
      };

      mediaRecorder.current.start(1000); // Record in 1-second chunks
      setIsRecording(true);

      console.log('Started recording with enhanced audio settings');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [onAudioData, toast]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording and cleaning up resources...');
    
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }

    if (processor.current) {
      processor.current.disconnect();
      processor.current = null;
    }

    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }

    setIsRecording(false);

    if (chunks.current.length > 0) {
      const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
      onRecordingComplete(audioBlob);
      chunks.current = [];
    }

    console.log('Recording stopped and audio resources cleaned up');
  }, [onRecordingComplete]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};

export default AudioCapture;