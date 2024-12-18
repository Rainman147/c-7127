import { useState } from "react";
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
      // Handle stop playback
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

      // Create audio context with user interaction
      let audioContext;
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        console.log('[TTS] Audio context created successfully:', audioContext.state);
      } catch (error) {
        console.error('[TTS] Failed to create audio context:', error);
        throw new Error('Failed to initialize audio playback');
      }

      // Show initial toast
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

          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          console.log(`[TTS] Successfully decoded audio for chunk ${i + 1}`);

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
        description: error.message || "Failed to play audio. Please try again.",
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