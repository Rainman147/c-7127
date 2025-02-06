import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTranscription = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const processAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setError(null);

      // Upload audio file to Supabase storage
      const fileName = `audio-${Date.now()}.wav`;
      const { error: uploadError } = await supabase.storage
        .from('audio_files')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Call transcription function
      const { data, error: transcribeError } = await supabase.functions
        .invoke('transcribe', {
          body: { fileName },
        });

      if (transcribeError) throw transcribeError;

      setProgress(100);
      return data.text || '';
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processAudio,
    isProcessing,
    progress,
    error,
  };
};