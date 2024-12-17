import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAudioUpload = () => {
  const { toast } = useToast();

  const uploadAudioChunk = useCallback(async (
    blob: Blob,
    sessionId: string,
    chunkNumber: number,
    totalChunks: number
  ) => {
    console.log('Uploading audio chunk:', { sessionId, chunkNumber, totalChunks });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const filePath = `chunks/${sessionId}/${chunkNumber}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('audio_files')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('audio_chunks')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          chunk_number: chunkNumber,
          total_chunks: totalChunks,
          storage_path: filePath,
          status: 'stored'
        });

      if (dbError) throw dbError;

      console.log('Successfully uploaded chunk:', { chunkNumber, totalChunks });
      return true;
    } catch (error) {
      console.error('Error uploading audio chunk:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload audio chunk. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return { uploadAudioChunk };
};