import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecordingState } from './useAudioRecordingState';

interface RecordingHookProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

export const useSimplifiedRecording = ({ 
  onTranscriptionComplete, 
  onError 
}: RecordingHookProps) => {
  const { toast } = useToast();
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const {
    isRecording,
    isProcessing,
    progress,
    currentChunk,
    totalChunks,
    updateState,
    resetState
  } = useAudioRecordingState();

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

      mediaRecorder.current.start(1000);
      updateState({ isRecording: true });
      console.log('Started recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording. Please check microphone permissions.');
    }
  }, [isRecording, onError, toast, updateState]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorder.current) {
      console.error('No active recording session');
      return;
    }

    try {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      updateState({ isRecording: false, isProcessing: true });

      const sessionId = crypto.randomUUID();
      console.log('Processing audio with session:', sessionId);

      const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
      console.log('Processing audio blob:', { size: audioBlob.size });

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

      updateState({ progress: 50 });

      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { 
          audioData: base64Data,
          mimeType: 'audio/webm',
          sessionId
        }
      });

      if (error) {
        console.error('Processing error:', error);
        throw error;
      }

      if (data?.transcription) {
        console.log('Transcription completed:', data.transcription.substring(0, 50) + '...');
        onTranscriptionComplete(data.transcription);
      } else {
        throw new Error('No transcription received');
      }

    } catch (error: any) {
      console.error('Error processing recording:', error);
      onError('Failed to process recording. Please try again.');
    } finally {
      resetState();
      chunks.current = [];
    }
  }, [onTranscriptionComplete, onError, updateState, resetState]);

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