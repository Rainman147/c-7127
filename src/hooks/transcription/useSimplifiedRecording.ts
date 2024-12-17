import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RecordingHookProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

export const useSimplifiedRecording = ({ onTranscriptionComplete, onError }: RecordingHookProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      chunks.current = [];

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      // Set a timeout to stop recording after 10 minutes
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 600000); // 10 minutes

      mediaRecorder.current.start(1000); // Collect data every second
      setIsRecording(true);
      console.log('Started recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording. Please check microphone permissions.');
    }
  }, [isRecording, onError]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorder.current) {
      console.error('No active recording session');
      return;
    }

    try {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsProcessing(true);

      // Combine all chunks into a single blob
      const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
      console.log('Processing audio blob:', { size: audioBlob.size });

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(audioBlob);
      const base64Data = await base64Promise;

      // Process audio using Edge Function
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { 
          audioData: base64Data,
          mimeType: 'audio/webm'
        }
      });

      if (error) {
        console.error('Processing error:', error);
        throw error;
      }

      if (data?.transcription) {
        console.log('Transcription received:', data.transcription);
        onTranscriptionComplete(data.transcription);
      } else {
        throw new Error('No transcription received from the server');
      }

    } catch (error: any) {
      console.error('Error processing recording:', error);
      onError('Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentChunk(0);
      setTotalChunks(0);
    }
  }, [onTranscriptionComplete, onError]);

  return {
    isRecording,
    isProcessing,
    progress,
    currentChunk,
    totalChunks,
    startRecording,
    stopRecording
  };
};