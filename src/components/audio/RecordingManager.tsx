import { useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getOptimalAudioConfig, getSupportedMimeType, getDeviceType } from '@/utils/deviceDetection';

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

const RecordingManager = ({ 
  onRecordingComplete, 
  onAudioData 
}: RecordingManagerProps): RecordingManagerReturn => {
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
      console.log('Starting recording with device-specific configuration');
      const deviceType = getDeviceType();
      console.log('Detected device type:', deviceType);

      const audioConfig = getOptimalAudioConfig();
      console.log('Using audio configuration:', audioConfig);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConfig
      });

      console.log('Successfully obtained media stream');

      // Create AudioContext only after user interaction
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext.current = new AudioContextClass();
      const source = audioContext.current.createMediaStreamSource(stream);

      // Use device-appropriate buffer size
      const bufferSize = deviceType.isMobile ? 2048 : 4096;
      processor.current = audioContext.current.createScriptProcessor(bufferSize, 1, 1);

      let accumulatedData = new Float32Array(0);
      const CHUNK_SIZE = deviceType.isMobile ? 8000 : 16000;

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

      const mimeType = getSupportedMimeType();
      console.log(`Using MIME type: ${mimeType}`);

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: deviceType.isMobile ? 64000 : 128000
      });
      
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        console.log('Data available event fired, chunk size:', e.data.size);
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.current.start(1000);
      setIsRecording(true);
      console.log('Recording started successfully');

    } catch (error: any) {
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
      const mimeType = getSupportedMimeType();
      const audioBlob = new Blob(chunks.current, { type: mimeType });
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