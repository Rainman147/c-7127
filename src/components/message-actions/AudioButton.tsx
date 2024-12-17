import { useState, useCallback } from "react";
import { Volume2, Loader2, Square } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { getDeviceType } from '@/utils/deviceDetection';
import type { AudioButtonProps } from './types';

// Smaller chunk size for faster initial playback
const CHUNK_SIZE = 100; // characters
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export const AudioButton = ({ content, isPlaying, setIsPlaying, audioRef }: AudioButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isIOS } = getDeviceType();

  // Split text at sentence boundaries
  const splitIntoChunks = (text: string): string[] => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  };

  // Process a single chunk with retry logic
  const processChunk = async (chunk: string, retryCount = 0): Promise<ArrayBuffer> => {
    try {
      console.log(`[TTS] Processing chunk: "${chunk.substring(0, 30)}..."`);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: chunk }
      });

      if (error) throw error;
      if (!data?.audio) throw new Error('No audio data received');

      // Convert base64 to ArrayBuffer
      const audioData = atob(data.audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      return arrayBuffer;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`[TTS] Retry ${retryCount + 1} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return processChunk(chunk, retryCount + 1);
      }
      throw error;
    }
  };

  const handleTextToSpeech = async () => {
    try {
      console.log('[TTS] Starting streaming text-to-speech process');
      
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
      console.log('[TTS] Split content into', chunks.length, 'chunks');

      // Create audio context for smooth playback
      const audioContext = new AudioContext();
      let currentTime = 0;
      let isFirstChunk = true;

      // Process chunks sequentially but start playing as soon as first chunk is ready
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
          const arrayBuffer = await processChunk(chunk);
          
          // Decode audio data
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          
          // Schedule playback
          if (isFirstChunk) {
            source.start(0);
            setIsPlaying(true);
            isFirstChunk = false;
          } else {
            source.start(currentTime);
          }
          
          currentTime += audioBuffer.duration;
          
          // Handle end of playback for last chunk
          if (i === chunks.length - 1) {
            source.onended = () => {
              setIsPlaying(false);
              audioContext.close();
            };
          }
        } catch (error) {
          console.error(`[TTS] Error processing chunk ${i + 1}:`, error);
          throw error;
        }
      }

    } catch (error: any) {
      console.error('[TTS] Text-to-speech error:', error);
      toast({
        title: "Error",
        description: "Audio playback unavailable. Please try again.",
        variant: "destructive",
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