import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
          toast({
            title: "Recording limit reached",
            description: "Maximum recording duration of 10 minutes reached.",
            duration: 3000,
          });
        }
      }, 600000);

      mediaRecorder.current.start(1000); // Collect data every second
      setIsRecording(true);
      console.log('Started recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording. Please check microphone permissions.');
    }
  }, [isRecording, onError, toast]);

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

      // Create session ID for this recording
      const sessionId = crypto.randomUUID();
      console.log('Processing audio with session:', sessionId);

      // Combine all chunks into a single blob
      const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
      console.log('Processing audio blob:', { size: audioBlob.size });

      // Split into 5-minute chunks if needed
      const CHUNK_SIZE = 5 * 60 * 1000; // 5 minutes in milliseconds
      const numberOfChunks = Math.ceil(audioBlob.size / CHUNK_SIZE);
      setTotalChunks(numberOfChunks);

      // Convert blob to base64
      const processChunk = async (chunk: Blob, chunkNumber: number) => {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
        });

        reader.readAsDataURL(chunk);
        const base64Data = await base64Promise;

        setCurrentChunk(chunkNumber);
        setProgress((chunkNumber / numberOfChunks) * 100);

        // Process chunk using Edge Function
        const { data, error } = await supabase.functions.invoke('transcribe', {
          body: { 
            audioData: base64Data,
            mimeType: 'audio/webm',
            chunkNumber,
            totalChunks: numberOfChunks,
            sessionId
          }
        });

        if (error) {
          console.error('Processing error:', error);
          throw error;
        }

        return data?.transcription || '';
      };

      // Process chunks sequentially
      let transcriptions: string[] = [];
      for (let i = 0; i < numberOfChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min((i + 1) * CHUNK_SIZE, audioBlob.size);
        const chunk = audioBlob.slice(start, end);
        
        try {
          const transcription = await processChunk(chunk, i + 1);
          transcriptions.push(transcription);
        } catch (error) {
          console.error(`Error processing chunk ${i + 1}:`, error);
          toast({
            title: "Warning",
            description: `Part of the recording could not be transcribed (chunk ${i + 1}).`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }

      // Combine transcriptions
      const finalTranscription = transcriptions.join(' ');
      if (finalTranscription) {
        console.log('Transcription completed:', finalTranscription.substring(0, 50) + '...');
        onTranscriptionComplete(finalTranscription);
      } else {
        throw new Error('No transcription received from any chunks');
      }

    } catch (error: any) {
      console.error('Error processing recording:', error);
      onError('Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentChunk(0);
      setTotalChunks(0);
      chunks.current = [];
    }
  }, [onTranscriptionComplete, onError, toast]);

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