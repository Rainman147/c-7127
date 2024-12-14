import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createAudioProcessingPipeline, encodeAudioData } from '@/utils/audioProcessing';

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

      // Create and connect audio processing pipeline
      const pipeline = createAudioProcessingPipeline(audioContext.current);
      pipeline.connectNodes(source);

      let accumulatedData = new Float32Array(0);
      const CHUNK_SIZE = 16000; // 1 second of audio at 16kHz

      processor.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Accumulate data
        const newData = new Float32Array(accumulatedData.length + inputData.length);
        newData.set(accumulatedData);
        newData.set(inputData, accumulatedData.length);
        accumulatedData = newData;

        // If we have enough data for a chunk, process it
        if (accumulatedData.length >= CHUNK_SIZE) {
          const chunk = accumulatedData.slice(0, CHUNK_SIZE);
          accumulatedData = accumulatedData.slice(CHUNK_SIZE);

          const encodedData = encodeAudioData(chunk);
          onAudioData(encodedData);
        }
      };

      source.connect(processor.current);
      processor.current.connect(audioContext.current.destination);

      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);

      console.log('Started recording with enhanced audio settings and noise suppression');
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
      const audioBlob = new Blob(chunks.current, { type: 'audio/wav' });
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