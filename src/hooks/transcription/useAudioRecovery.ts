import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useChat } from '@/hooks/chat';

interface AudioChunk {
  storage_path: string;
  chunk_number: number;
  status: string;
  id: string;
}

export const useAudioRecovery = () => {
  const { toast } = useToast();
  const { handleSendMessage } = useChat();

  useEffect(() => {
    const recoverAudioSessions = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;

        console.log('Checking for interrupted audio sessions...');

        // Get incomplete audio chunks
        const { data: chunks, error: chunksError } = await supabase
          .from('audio_chunks')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'stored')
          .order('chunk_number', { ascending: true });

        if (chunksError) throw chunksError;

        if (!chunks || chunks.length === 0) {
          console.log('No interrupted audio sessions found');
          return;
        }

        console.log('Found interrupted audio sessions:', chunks.length);

        // Group chunks by session ID
        const sessions = (chunks as AudioChunk[]).reduce((acc: { [key: string]: AudioChunk[] }, chunk) => {
          const sessionId = chunk.storage_path.split('/')[1];
          if (!acc[sessionId]) {
            acc[sessionId] = [];
          }
          acc[sessionId].push(chunk);
          return acc;
        }, {});

        // Process each session
        for (const [sessionId, sessionChunks] of Object.entries(sessions)) {
          console.log(`Processing recovered session ${sessionId} with ${sessionChunks.length} chunks`);

          try {
            // Download and combine chunks
            const audioBlobs = await Promise.all(
              sessionChunks.map(async (chunk) => {
                try {
                  const { data, error } = await supabase.storage
                    .from('audio_files')
                    .download(chunk.storage_path);
                  
                  if (error) {
                    console.warn(`Failed to download chunk ${chunk.storage_path}:`, error);
                    // Mark chunk as failed
                    await supabase
                      .from('audio_chunks')
                      .update({ status: 'failed' })
                      .eq('id', chunk.id);
                    return null;
                  }
                  return data;
                } catch (error) {
                  console.error(`Error downloading chunk ${chunk.storage_path}:`, error);
                  return null;
                }
              })
            );

            // Filter out failed chunks
            const validBlobs = audioBlobs.filter(blob => blob !== null) as Blob[];

            if (validBlobs.length === 0) {
              console.warn(`No valid chunks found for session ${sessionId}`);
              continue;
            }

            // Combine blobs
            const combinedBlob = new Blob(validBlobs, { type: 'audio/webm' });

            // Convert to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onloadend = () => {
                const base64String = reader.result as string;
                resolve(base64String.split(',')[1]);
              };
              reader.onerror = reject;
            });

            reader.readAsDataURL(combinedBlob);
            const base64Data = await base64Promise;

            // Send to transcription service
            const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe', {
              body: { 
                audioData: base64Data,
                mimeType: 'audio/webm'
              }
            });

            if (transcriptionError) throw transcriptionError;

            if (transcriptionData?.transcription) {
              console.log('Successfully recovered and transcribed audio session');
              
              // Create a new chat message with the transcription
              await handleSendMessage(transcriptionData.transcription, 'audio');

              // Update chunks status
              await Promise.all(sessionChunks.map(chunk => 
                supabase
                  .from('audio_chunks')
                  .update({ status: 'processed' })
                  .eq('id', chunk.id)
              ));

              toast({
                title: "Audio Recovery",
                description: "Previously interrupted recording has been recovered and transcribed.",
                variant: "default"
              });
            }
          } catch (error) {
            console.error(`Error processing session ${sessionId}:`, error);
            
            // Mark chunks as failed
            await Promise.all(sessionChunks.map(chunk => 
              supabase
                .from('audio_chunks')
                .update({ status: 'failed' })
                .eq('id', chunk.id)
            ));
          }
        }
      } catch (error) {
        console.error('Error in audio recovery:', error);
      }
    };

    recoverAudioSessions();
  }, []); // Run once on component mount
};