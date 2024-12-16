import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useChunkUpload = () => {
  const { toast } = useToast();

  const uploadChunk = useCallback(async (chunk: Blob, sessionId: string, chunkNumber: number) => {
    if (!sessionId) {
      throw new Error('No active recording session');
    }

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create FormData for the chunk
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('sessionId', sessionId);
      formData.append('chunkNumber', chunkNumber.toString());
      formData.append('userId', user.id);

      console.log('Processing chunk for session:', sessionId);

      const { data, error } = await supabase.functions.invoke('backup-audio-chunk', {
        body: formData
      });

      if (error) {
        console.error('Error processing chunk:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Failed to process chunk:', error);
      toast({
        title: "Error",
        description: "Failed to process audio chunk. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  return { uploadChunk };
};