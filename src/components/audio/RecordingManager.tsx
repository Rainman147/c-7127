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
    // Convert to 16-bit PCM
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Convert to base64
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // Required by Gemini
          channelCount: 1,   // Mono audio
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Microphone access granted, initializing audio context...');
      audioContext.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.current.createMediaStreamSource(stream);
      processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

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

          if (onAudioData) {
            const encodedData = encodeAudioData(chunk);
            setAudioData(encodedData);
            onAudioData(encodedData);
          }
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

  const handleStopRecording = useCallback(() => {
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
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    audioData
  };
};

export default RecordingManager;