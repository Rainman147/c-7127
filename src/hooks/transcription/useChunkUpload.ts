
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useChunkUpload = () => {
  const { toast } = useToast();

  const uploadChunk = useCallback(async (chunk: Blob, sessionId: string, chunkNumber: number, totalChunks: number) => {
    if (!sessionId) {
      throw new Error('No active recording session');
    }

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create a storage path for the chunk
      const storagePath = `${user.id}/${sessionId}/chunk_${chunkNumber}.webm`;
      console.log('[useChunkUpload] Uploading chunk to storage:', {
        path: storagePath,
        size: chunk.size,
        chunkNumber,
        totalChunks
      });

      // Upload chunk to storage
      const { error: uploadError } = await supabase.storage
        .from('audio_files')
        .upload(storagePath, chunk, {
          contentType: 'audio/webm',
          upsert: true
        });

      if (uploadError) {
        console.error('[useChunkUpload] Storage upload error:', uploadError);
        throw uploadError;
      }

      // Store chunk metadata in database
      const { error: insertError } = await supabase
        .from('audio_chunks')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          storage_path: storagePath,
          chunk_number: chunkNumber,
          total_chunks: totalChunks,
          original_filename: `chunk_${chunkNumber}.webm`,
          status: 'stored'
        });

      if (insertError) {
        console.error('[useChunkUpload] Database insert error:', insertError);
        throw insertError;
      }

      console.log('[useChunkUpload] Successfully uploaded chunk:', {
        chunkNumber,
        sessionId,
        storagePath,
        totalChunks
      });

      return { success: true, storagePath };
    } catch (error: any) {
      console.error('[useChunkUpload] Failed to process chunk:', error);
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
