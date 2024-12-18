import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedCallback } from 'use-debounce';
import { audioEngine } from '@/utils/audio/audioEngine';

const MAX_TEXT_LENGTH = 4096;

export const useAudioPlayer = (options?: { onError?: (error: string) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePlayback = useDebouncedCallback(async (text: string) => {
    console.log('[useAudioPlayer] Starting playback request:', { textLength: text.length });

    if (isPlaying) {
      console.log('[useAudioPlayer] Stopping current playback');
      audioEngine.stop();
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    if (isProcessing) {
      console.log('[useAudioPlayer] Request already in progress');
      return;
    }

    try {
      setIsLoading(true);
      setIsProcessing(true);
      console.log('[useAudioPlayer] Starting text-to-speech process');

      const truncatedText = text.slice(0, MAX_TEXT_LENGTH);
      if (text.length > MAX_TEXT_LENGTH) {
        console.warn('[useAudioPlayer] Text truncated to 4096 characters');
        toast({
          title: "Text too long",
          description: "The text has been truncated to fit the maximum length.",
          variant: "default",
        });
      }

      const response = await supabase.functions.invoke('text-to-speech', {
        body: { text: truncatedText }
      });

      if (response.error) {
        throw new Error(`API Error: ${response.error.message}`);
      }

      if (!response.data) {
        throw new Error('No audio data received');
      }

      console.log('[useAudioPlayer] Received audio data, preparing playback');

      // Convert the response data to Uint8Array and create AudioBuffer
      const uint8Array = new Uint8Array(Object.values(response.data));
      const audioBuffer = await audioEngine.loadAudio(uint8Array.buffer);
      
      // Start playback
      audioEngine.play(audioBuffer);
      setIsPlaying(true);
      setIsLoading(false);

    } catch (error: any) {
      console.error('[useAudioPlayer] Error in text-to-speech process:', error);
      audioEngine.stop();
      setIsPlaying(false);
      setIsLoading(false);
      
      toast({
        title: "Error",
        description: "Unable to play audio. Please try again later.",
        variant: "destructive",
      });
      
      options?.onError?.(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, 300);

  return {
    isLoading,
    isPlaying,
    isProcessing,
    handlePlayback
  };
};