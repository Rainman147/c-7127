import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMediaRecorder } from './useMediaRecorder';
import { useAudioStream } from './useAudioStream';
import { convertWebMToWav } from '@/utils/audio/conversion';

interface RecordingOptions {
  onError: (error: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

export const useRecording = ({ onError, onTranscriptionComplete }: RecordingOptions) => {
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const { getStream, cleanupStream } = useAudioStream();

  const handleDataAvailable = useCallback(async (data: Blob) => {
    console.log('Recording chunk received:', {
      size: data.size,
      type: data.type,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Convert WebM to WAV
      console.log('Starting WebM to WAV conversion');
      const wavBlob = await convertWebMToWav(data);
      console.log('WAV conversion complete:', {
        originalSize: data.size,
        wavSize: wavBlob.size,
        wavType: wavBlob.type
      });

      // Convert WAV blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(wavBlob);
      const base64Data = await base64Promise;
      
      console.log('Sending audio to transcription service:', {
        dataLength: base64Data.length,
        mimeType: wavBlob.type
      });

      // Send to transcription service
      const { data: transcriptionData, error } = await supabase.functions.invoke('transcribe', {
        body: { 
          audioData: base64Data,
          mimeType: wavBlob.type
        }
      });

      if (error) {
        console.error('Transcription error:', error);
        // Don't stop recording on transcription error
        return;
      }

      if (transcriptionData?.transcription) {
        console.log('Transcription received:', {
          length: transcriptionData.transcription.length,
          preview: transcriptionData.transcription.substring(0, 50)
        });
        onTranscriptionComplete(transcriptionData.transcription);
      }
    } catch (error: any) {
      console.error('Error processing recording:', error);
      // Don't stop recording on conversion error, just log it
      console.warn('Continuing recording despite conversion error');
    }
  }, [onTranscriptionComplete]);

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

  const startRec = useCallback(async () => {
    try {
      console.log('Requesting audio stream');
      const stream = await getStream();
      console.log('Audio stream obtained:', {
        tracks: stream.getTracks().length,
        settings: stream.getTracks()[0].getSettings()
      });
      
      setCurrentStream(stream);
      await startRecording(stream);
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      onError(error.message);
    }
  }, [getStream, startRecording, onError]);

  const stopRec = useCallback(() => {
    console.log('Stopping recording...');
    stopRecording();
    if (currentStream) {
      console.log('Cleaning up media stream');
      cleanupStream(currentStream);
      setCurrentStream(null);
    }
  }, [stopRecording, currentStream, cleanupStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentStream) {
        console.log('Cleaning up media stream on unmount');
        cleanupStream(currentStream);
      }
    };
  }, [currentStream, cleanupStream]);

  return {
    isRecording,
    startRecording: startRec,
    stopRecording: stopRec
  };
};