import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useChunkProcessing = () => {
  const processChunk = useCallback(async (chunk: Blob, sessionId: string) => {
    console.log('Processing chunk for session:', sessionId);
    
    try {
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('sessionId', sessionId);

      const { data, error } = await supabase.functions.invoke('backup-audio-chunk', {
        body: formData
      });

      if (error) {
        console.error('Error processing chunk:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to process chunk:', error);
      throw error;
    }
  }, []);

  return { processChunk };
};