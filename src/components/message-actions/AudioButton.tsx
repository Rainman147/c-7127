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
      
      // Create audio context early to handle user gesture
      const audioContext = await createAudioContext();
      
      // Show initial toast
      toast({
        title: "Preparing Audio",
        description: "Processing your text...",
        duration: 3000,
      });

      const chunks = splitIntoChunks(content);
      let currentTime = 0;
      let isFirstChunk = true;

      for (let i = 0; i < chunks.length; i++) {
        try {
          const arrayBuffer = await processChunk(chunks[i]);
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
          
        } catch (error) {
          console.error(`[TTS] Error processing chunk ${i + 1}:`, error);
          throw error;
        }
      }

    } catch (error: any) {
      console.error('[TTS] Critical error in text-to-speech process:', error);
      
      toast({
        title: "Playback Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
      
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      className={`p-1 transition-colors ${isPlaying ? 'text-blue-500' : 'hover:text-white'}`}
      onClick={handleTextToSpeech}
      disabled={isLoading}
      aria-label={isPlaying ? "Stop audio playback" : "Play text as audio"}
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