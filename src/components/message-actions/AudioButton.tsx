import { useState, useCallback } from "react";
import { Volume2, Loader2, Square } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { getDeviceType } from '@/utils/deviceDetection';
import type { AudioButtonProps } from './types';

const CHUNK_SIZE = 100; // characters
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export const AudioButton = ({ content, isPlaying, setIsPlaying, audioRef }: AudioButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isIOS } = getDeviceType();

  // Split text at sentence boundaries with logging
  const splitIntoChunks = (text: string): string[] => {
    console.log('[TTS-Chunking] Starting text chunking process');
    console.log('[TTS-Chunking] Input text length:', text.length);
    
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    console.log('[TTS-Chunking] Number of sentences:', sentences.length);
    
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

    console.log('[TTS-Chunking] Final chunks:', {
      numberOfChunks: chunks.length,
      averageChunkLength: chunks.reduce((acc, chunk) => acc + chunk.length, 0) / chunks.length,
      smallestChunk: Math.min(...chunks.map(c => c.length)),
      largestChunk: Math.max(...chunks.map(c => c.length))
    });

    return chunks;
  };

  // Process a single chunk with detailed error logging
  const processChunk = async (chunk: string, retryCount = 0): Promise<ArrayBuffer> => {
    try {
      console.log('[TTS-Processing] Processing chunk:', {
        chunkLength: chunk.length,
        retryCount,
        preview: chunk.substring(0, 50) + '...'
      });
      
      const startTime = performance.now();
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: chunk }
      });

      const processingTime = performance.now() - startTime;
      console.log('[TTS-Processing] API response time:', processingTime.toFixed(2), 'ms');

      if (error) {
        console.error('[TTS-Processing] API error:', {
          error,
          chunk: chunk.substring(0, 50) + '...',
          retryCount
        });
        throw error;
      }

      if (!data?.audio) {
        console.error('[TTS-Processing] No audio data received:', {
          dataReceived: !!data,
          hasAudioProperty: data ? 'audio' in data : false
        });
        throw new Error('No audio data received');
      }

      // Convert base64 to ArrayBuffer with logging
      console.log('[TTS-Processing] Converting base64 to ArrayBuffer');
      const audioData = atob(data.audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      console.log('[TTS-Processing] Chunk processed successfully:', {
        originalSize: chunk.length,
        audioSize: arrayBuffer.byteLength
      });
      
      return arrayBuffer;
    } catch (error) {
      console.error('[TTS-Processing] Error processing chunk:', {
        error,
        retryCount,
        maxRetries: MAX_RETRIES
      });

      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`[TTS-Processing] Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return processChunk(chunk, retryCount + 1);
      }
      throw error;
    }
  };

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

      // Create audio context for smooth playback
      console.log('[TTS] Creating AudioContext');
      const audioContext = new AudioContext();
      let currentTime = 0;
      let isFirstChunk = true;

      // Process chunks sequentially but start playing as soon as first chunk is ready
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
          console.log(`[TTS] Processing chunk ${i + 1}/${chunks.length}`);
          const startTime = performance.now();
          
          const arrayBuffer = await processChunk(chunk);
          console.log(`[TTS] Chunk ${i + 1} processing completed in ${(performance.now() - startTime).toFixed(2)}ms`);
          
          // Decode audio data
          console.log('[TTS] Decoding audio data');
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          
          // Schedule playback
          if (isFirstChunk) {
            console.log('[TTS] Starting playback of first chunk');
            source.start(0);
            setIsPlaying(true);
            isFirstChunk = false;
          } else {
            console.log(`[TTS] Scheduling chunk ${i + 1} at ${currentTime.toFixed(2)}s`);
            source.start(currentTime);
          }
          
          currentTime += audioBuffer.duration;
          console.log('[TTS] Updated schedule:', {
            currentChunk: i + 1,
            totalChunks: chunks.length,
            chunkDuration: audioBuffer.duration.toFixed(2),
            totalDuration: currentTime.toFixed(2)
          });
          
          // Handle end of playback for last chunk
          if (i === chunks.length - 1) {
            source.onended = () => {
              console.log('[TTS] Playback completed');
              setIsPlaying(false);
              audioContext.close();
            };
          }
        } catch (error) {
          console.error(`[TTS] Error processing chunk ${i + 1}:`, {
            error,
            chunk: chunk.substring(0, 50) + '...',
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