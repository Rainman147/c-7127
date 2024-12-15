import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AudioProcessingOptions {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

export const useAudioProcessing = ({ 
  onTranscriptionComplete, 
  onError 
}: AudioProcessingOptions) => {
  const processAudioData = useCallback(async (audioData: string, mimeType: string): Promise<string> => {
    console.log('Processing audio data:', { mimeType });
    
    try {
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { 
          audioData,
          mimeType,
          streaming: true
        }
      });

      if (error) {
        console.error('Transcription error:', error);
        throw error;
      }

      if (!data?.transcription) {
        throw new Error('No transcription received');
      }

      console.log('Transcription received:', data.transcription);
      onTranscriptionComplete(data.transcription);
      return data.transcription;

    } catch (error: any) {
      console.error('Audio processing error:', error);
      onError(error.message || 'Failed to process audio');
      throw error;
    }
  }, [onTranscriptionComplete, onError]);

  const handleFileUpload = useCallback(async (file: File) => {
    console.log('Processing uploaded file:', { type: file.type, size: file.size });
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      const base64Data = await base64Promise;
      
      return await processAudioData(base64Data, file.type);
    } catch (error: any) {
      console.error('File upload error:', error);
      onError(error.message || 'Failed to process audio file');
      throw error;
    }
  }, [processAudioData, onError]);

  return {
    processAudioData,
    handleFileUpload
  };
};