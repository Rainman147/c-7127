import { useState, useCallback } from "react";
import { Volume2, Loader2, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDeviceType } from '@/utils/deviceDetection';
import { splitIntoChunks, processChunk } from './audio/AudioProcessor';
import { createAudioContext, scheduleAudioPlayback } from './audio/AudioPlayback';
import type { AudioButtonProps } from './types';

export const AudioButton = ({ content, isPlaying, setIsPlaying, audioRef }: AudioButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isIOS } = getDeviceType();

  const handleTextToSpeech = async () => {
    console.log('[TTS] Starting text-to-speech process');
    console.log('[TTS] Device info:', { 
      isIOS,
      userAgent: navigator.userAgent,
      audioContext: typeof AudioContext !== 'undefined'
    });
    
    try {
      if (isPlaying) {
        console.log('[TTS] Stopping current playback');
        if (audioRef[0]) {
          audioRef[0].pause();
          audioRef[0].currentTime = 0;
        }
        setIsPlaying(false);
        return;
      }

      setIsLoading(true);
      const chunks = splitIntoChunks(content);
      console.log('[TTS] Text split into chunks:', {
        numberOfChunks: chunks.length,
        totalLength: content.length
      });

      const audioContext = await createAudioContext();
      let currentTime = 0;
      let isFirstChunk = true;

      for (let i = 0; i < chunks.length; i++) {
        try {
          console.log(`[TTS] Processing chunk ${i + 1}/${chunks.length}`);
          const startTime = performance.now();
          
          const arrayBuffer = await processChunk(chunks[i]);
          console.log(`[TTS] Chunk ${i + 1} processing completed in ${(performance.now() - startTime).toFixed(2)}ms`);
          
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const newTime = await scheduleAudioPlayback(
            audioContext,
            audioBuffer,
            currentTime,
            isFirstChunk,
            i === chunks.length - 1 ? () => {
              console.log('[TTS] Playback completed');
              setIsPlaying(false);
              audioContext.close();
            } : undefined
          );
          
          if (isFirstChunk) {
            setIsPlaying(true);
            isFirstChunk = false;
          }
          
          currentTime = newTime;
          
        } catch (error) {
          console.error(`[TTS] Error processing chunk ${i + 1}:`, {
            error,
            chunk: chunks[i].substring(0, 50) + '...',
            currentTime,
            isFirstChunk
          });
          throw error;
        }
      }

    } catch (error: any) {
      console.error('[TTS] Critical error in text-to-speech process:', {
        error,
        errorMessage: error.message,
        errorStack: error.stack,
        content: content.substring(0, 100) + '...'
      });
      
      toast({
        title: "Error",
        description: "Audio playback unavailable. Please try again.",
        variant: "destructive",
      });
      setIsPlaying(false);
    } finally {
      console.log('[TTS] Cleaning up and resetting state');
      setIsLoading(false);
    }
  };

  return (
    <button 
      className={`p-1 transition-colors ${isPlaying ? 'text-blue-500' : 'hover:text-white'}`}
      onClick={handleTextToSpeech}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <Square className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </button>
  );
};