import { useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RecordingManagerProps {
  onRecordingComplete: (blob: Blob) => void;
  onAudioData?: (data: string) => void;
}

interface RecordingManagerReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  audioData?: string;
}

const RecordingManager = ({ onRecordingComplete, onAudioData }: RecordingManagerProps): RecordingManagerReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<string>();
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const processor = useRef<ScriptProcessorNode | null>(null);
  const chunks = useRef<Blob[]>([]);
  const { toast } = useToast();

  const encodeAudioData = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  };

  const handleStartRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      
      // More permissive audio constraints for mobile devices
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true }
        }
      });

      console.log('Microphone access granted, initializing audio context...');
      
      // Create AudioContext only after user interaction
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.current.createMediaStreamSource(stream);
      
      // Use a more compatible buffer size for mobile
      processor.current = audioContext.current.createScriptProcessor(2048, 1, 1);

      let accumulatedData = new Float32Array(0);
      const CHUNK_SIZE = 16000;

      processor.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        const newData = new Float32Array(accumulatedData.length + inputData.length);
        newData.set(accumulatedData);
        newData.set(inputData, accumulatedData.length);
        accumulatedData = newData;

        if (accumulatedData.length >= CHUNK_SIZE) {
          const chunk = accumulatedData.slice(0, CHUNK_SIZE);
          accumulatedData = accumulatedData.slice(CHUNK_SIZE);

          if (onAudioData) {
            const encodedData = encodeAudioData(chunk);
            setAudioData(encodedData);
            onAudioData(encodedData);
          }
        }
      };

      source.connect(processor.current);
      processor.current.connect(audioContext.current.destination);

      // Try different MIME types based on browser support
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/wav';

      console.log('Using MIME type:', mimeType);
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        console.log('Data available event fired, chunk size:', e.data.size);
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.current.start(1000); // Collect data every second
      setIsRecording(true);

      console.log('Started recording with mobile-compatible settings');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [onAudioData, toast]);

  const handleStopRecording = useCallback(() => {
    console.log('Stopping recording and cleaning up resources...');
    
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
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
      console.log('Creating final audio blob from chunks:', chunks.current.length);
      const audioBlob = new Blob(chunks.current, { type: 'audio/wav' });
      console.log('Final blob size:', audioBlob.size);
      onRecordingComplete(audioBlob);
      chunks.current = [];
    }

    console.log('Recording stopped and audio resources cleaned up');
  }, [onRecordingComplete]);

  return {
    isRecording,
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    audioData
  };
};

export default RecordingManager;