import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { splitIntoChunks, processChunk } from './AudioProcessor';
import { createAudioContext, scheduleAudioPlayback } from './AudioPlayback';

export const useAudioPlayback = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const handleTextToSpeech = async (content: string) => {
    console.log('[TTS] Starting text-to-speech process');
    
    try {
      // Handle stop playback
      if (isPlaying) {
        console.log('[TTS] Stopping current playback');
        setIsPlaying(false);
        return;
      }

      setIsLoading(true);
      console.log('[TTS] Content to process:', content.substring(0, 50) + '...');

      // Create audio context with user interaction
      const audioContext = await createAudioContext();
      console.log('[TTS] Audio context created:', {
        state: audioContext.state,
        sampleRate: audioContext.sampleRate
      });

      toast({
        title: "Preparing Audio",
        description: "Processing your text...",
        duration: 3000,
      });

      const chunks = splitIntoChunks(content);
      console.log('[TTS] Split content into chunks:', chunks.length);

      let currentTime = 0;
      let isFirstChunk = true;

      for (let i = 0; i < chunks.length; i++) {
        try {
          console.log(`[TTS] Processing chunk ${i + 1}/${chunks.length}`);
          const arrayBuffer = await processChunk(chunks[i]);
          
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            console.error('[TTS] Received empty audio data for chunk:', i + 1);
            throw new Error('Received empty audio data');
          }

          console.log(`[TTS] Chunk ${i + 1} size:`, arrayBuffer.byteLength, 'bytes');
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          console.log(`[TTS] Successfully decoded audio for chunk ${i + 1}, duration:`, audioBuffer.duration);

          const newTime = await scheduleAudioPlayback(
            audioContext,
            audioBuffer,
            currentTime,
            isFirstChunk,
            i === chunks.length - 1 ? () => {
              console.log('[TTS] Playback completed');
              setIsPlaying(false);
              audioContext.close();
              
              toast({
                title: "Playback Complete",
                description: "Audio finished playing",
                duration: 2000,
              });
            } : undefined
          );
          
          if (isFirstChunk) {
            setIsPlaying(true);
            toast({
              title: "Playing Audio",
              description: "Starting playback...",
              duration: 2000,
            });
            isFirstChunk = false;
          }
          
          currentTime = newTime;
          console.log(`[TTS] Scheduled chunk ${i + 1}, next start time:`, currentTime);
          
        } catch (error) {
          console.error(`[TTS] Error processing chunk ${i + 1}:`, error);
          throw error;
        }
      }

    } catch (error: any) {
      console.error('[TTS] Critical error in text-to-speech process:', error);
      
      toast({
        title: "Playback Error",
        description: error.message || "Failed to play audio. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
      
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isPlaying,
    handleTextToSpeech
  };
};