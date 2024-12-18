import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedCallback } from 'use-debounce';
import type { AudioPlayerHookReturn } from './types';

const MAX_TEXT_LENGTH = 4096;

export const useAudioPlayer = (content: string): AudioPlayerHookReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    console.log('[useAudioPlayer] Cleaning up audio resources');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handlePlayback = useDebouncedCallback(async () => {
    if (isPlaying) {
      console.log('[useAudioPlayer] Stopping playback');
      cleanup();
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

      const truncatedText = content.slice(0, MAX_TEXT_LENGTH);
      if (content.length > MAX_TEXT_LENGTH) {
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

      cleanup();
      const audio = new Audio();
      audioRef.current = audio;

      // Convert the response data to Uint8Array and create a blob
      const uint8Array = new Uint8Array(Object.values(response.data));
      const blob = new Blob([uint8Array], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);
      
      audio.src = audioUrl;
      
      audio.oncanplaythrough = () => {
        console.log('[useAudioPlayer] Audio ready to play');
        audio.play().catch((e) => {
          console.error('[useAudioPlayer] Play error:', e);
          cleanup();
          toast({
            title: "Playback Error",
            description: "Unable to play audio. Please try again.",
            variant: "destructive",
          });
        });
      };

      audio.onplay = () => {
        console.log('[useAudioPlayer] Audio playback started');
        setIsPlaying(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        console.log('[useAudioPlayer] Audio playback completed');
        cleanup();
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error('[useAudioPlayer] Audio playback error:', e);
        cleanup();
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Playback Error",
          description: "Unable to play audio. Please try again later.",
          variant: "destructive",
        });
      };

    } catch (error: any) {
      console.error('[useAudioPlayer] Error in text-to-speech process:', error);
      cleanup();
      toast({
        title: "Error",
        description: "Unable to generate audio. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, 300);

  return {
    isLoading,
    isPlaying,
    isProcessing,
    handlePlayback,
    cleanup
  };
};