import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

const MAX_RECORDING_DURATION = 600000; // 10 minutes in milliseconds
const CHUNK_DURATION = 300000; // 5 minutes in milliseconds

interface RecordingHookProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

export const useSimplifiedRecording = ({ onTranscriptionComplete, onError }: RecordingHookProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const sessionId = useRef<string>('');
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

      sessionId.current = uuidv4();
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

      // Set a timeout to stop recording after MAX_RECORDING_DURATION
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
          toast({
            title: "Recording limit reached",
            description: "Maximum recording duration of 10 minutes reached",
            variant: "default"
          });
        }
      }, MAX_RECORDING_DURATION);

      mediaRecorder.current.start(CHUNK_DURATION);
      setIsRecording(true);
      console.log('Started recording with session:', sessionId.current);
    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording. Please check microphone permissions.');
    }
  }, [isRecording, onError, toast]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorder.current || !sessionId.current) {
      console.error('No active recording session');
      return;
    }

    try {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsProcessing(true);

      console.log('Processing recorded chunks:', chunks.current.length);

      // Combine all chunks into a single blob
      const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
      
      // Split into 5-minute chunks if needed
      const numberOfChunks = Math.ceil(audioBlob.size / (5 * 1024 * 1024)); // 5MB chunks
      const chunkArray: Blob[] = [];

      for (let i = 0; i < numberOfChunks; i++) {
        const start = i * 5 * 1024 * 1024;
        const end = Math.min(start + 5 * 1024 * 1024, audioBlob.size);
        chunkArray.push(audioBlob.slice(start, end));
      }

      console.log('Split into chunks:', chunkArray.length);

      // Upload and process each chunk
      let combinedTranscription = '';
      for (let i = 0; i < chunkArray.length; i++) {
        setProgress(Math.round((i / chunkArray.length) * 100));
        
        // Convert chunk to base64
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]);
          };
          reader.readAsDataURL(chunkArray[i]);
        });

        // Upload and transcribe chunk
        const { data, error } = await supabase.functions.invoke('transcribe', {
          body: {
            audioData: base64Data,
            mimeType: 'audio/webm',
            sessionId: sessionId.current,
            chunkNumber: i + 1,
            totalChunks: chunkArray.length
          }
        });

        if (error) {
          throw error;
        }

        if (data?.transcription) {
          combinedTranscription += (combinedTranscription ? ' ' : '') + data.transcription;
          
          // Update progress in UI
          if (i < chunkArray.length - 1) {
            toast({
              title: "Processing chunks",
              description: `Processed chunk ${i + 1} of ${chunkArray.length}`,
              duration: 2000,
            });
          }
        }
      }

      setIsProcessing(false);
      setProgress(100);
      onTranscriptionComplete(combinedTranscription);

      toast({
        title: "Success",
        description: "Audio transcription completed",
        duration: 3000,
      });

    } catch (error) {
      console.error('Error processing recording:', error);
      setIsProcessing(false);
      setProgress(0);
      onError('Failed to process recording. Please try again.');
    }
  }, [onTranscriptionComplete, onError, toast]);

  return {
    isRecording,
    isProcessing,
    progress,
    startRecording,
    stopRecording
  };
};