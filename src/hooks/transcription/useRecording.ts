import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMediaRecorder } from './useMediaRecorder';
import { useAudioStream } from './useAudioStream';

interface RecordingOptions {
  onError: (error: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

export const useRecording = ({ onError, onTranscriptionComplete }: RecordingOptions) => {
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const { getStream, cleanupStream } = useAudioStream();

  const handleDataAvailable = useCallback(async (data: Blob) => {
    console.log('Recording chunk received, size:', data.size);
    
    try {
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

      reader.readAsDataURL(data);
      const base64Data = await base64Promise;

      // Send to transcription service
      const { data: transcriptionData, error } = await supabase.functions.invoke('transcribe', {
        body: { 
          audioData: base64Data,
          mimeType: data.type
        }
      });

      if (error) {
        console.error('Transcription error:', error);
        onError(error.message);
        return;
      }

      if (transcriptionData?.transcription) {
        console.log('Transcription received:', transcriptionData.transcription);
        onTranscriptionComplete(transcriptionData.transcription);
      } else {
        onError('No transcription received from the service');
      }
    } catch (error: any) {
      console.error('Error processing recording:', error);
      onError(error.message || 'Failed to process recording');
    }
  }, [onTranscriptionComplete, onError]);

  const handleError = useCallback((error: Error) => {
    console.error('Recording error:', error);
    if (currentStream) {
      cleanupStream(currentStream);
      setCurrentStream(null);
    }
    onError(error.message);
  }, [currentStream, cleanupStream, onError]);

  const { isRecording, startRecording, stopRecording } = useMediaRecorder({
    onDataAvailable: handleDataAvailable,
    onError: handleError
  });

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (currentStream) {
        cleanupStream(currentStream);
      }
    };
  }, [currentStream, cleanupStream]);

  const startRec = useCallback(async () => {
    try {
      const stream = await getStream();
      setCurrentStream(stream);
      await startRecording(stream);
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      onError(error.message);
    }
  }, [getStream, startRecording, onError]);

  const stopRec = useCallback(() => {
    stopRecording();
    if (currentStream) {
      cleanupStream(currentStream);
      setCurrentStream(null);
    }
  }, [stopRecording, currentStream, cleanupStream]);

  return {
    isRecording,
    startRecording: startRec,
    stopRecording: stopRec
  };
};