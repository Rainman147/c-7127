import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { AudioPlayerState, AudioPlayerOptions } from '@/types/audio';

const MAX_TEXT_LENGTH = 4096;

export const useAudioPlayer = (options?: AudioPlayerOptions) => {
  const [state, setState] = useState<AudioPlayerState>({
    isLoading: false,
    isPlaying: false,
    error: null
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Cleanup function to handle audio resources
  const cleanup = useCallback(() => {
    console.log('[AudioPlayer] Cleaning up resources');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }
    setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
  }, []);

  // Effect to clean up audio resources on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handlePlayback = useCallback(async (text: string) => {
    try {
      // Prevent multiple requests
      if (state.isLoading || state.isPlaying) {
        console.log('[AudioPlayer] Stopping current playback');
        cleanup();
        return;
      }

      // Check browser compatibility
      if (!window.Audio) {
        throw new Error('Your browser does not support audio playback');
      }

      // Validate and truncate text
      if (!text?.trim()) {
        throw new Error('No text provided for audio playback');
      }

      const truncatedText = text.slice(0, MAX_TEXT_LENGTH);
      if (text.length > MAX_TEXT_LENGTH) {
        toast({
          title: "Text truncated",
          description: `Text was truncated to ${MAX_TEXT_LENGTH} characters`,
          variant: "default"
        });
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));
      console.log('[AudioPlayer] Starting text-to-speech process');

      const response = await supabase.functions.invoke('text-to-speech', {
        body: { text: truncatedText }
      });

      if (!response.data) {
        throw new Error('No audio data received from server');
      }

      console.log('[AudioPlayer] Received audio data, preparing playback');

      // Create new audio instance
      cleanup();
      const audio = new Audio();
      audioRef.current = audio;

      // Convert response data to audio blob
      const uint8Array = new Uint8Array(Object.values(response.data));
      const blob = new Blob([uint8Array], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);

      // Set up audio event handlers before setting src
      const handleCanPlayThrough = () => {
        console.log('[AudioPlayer] Audio ready to play');
        setState(prev => ({ ...prev, isLoading: false, isPlaying: true }));
        options?.onPlaybackStart?.();
        audio.play().catch(error => {
          console.error('[AudioPlayer] Play error:', error);
          cleanup();
          URL.revokeObjectURL(audioUrl);
          throw new Error('Failed to start audio playback');
        });
      };

      const handleEnded = () => {
        console.log('[AudioPlayer] Playback completed');
        options?.onPlaybackEnd?.();
        cleanup();
        URL.revokeObjectURL(audioUrl);
      };

      const handleError = (e: Event) => {
        console.error('[AudioPlayer] Audio error:', e);
        cleanup();
        URL.revokeObjectURL(audioUrl);
        setState(prev => ({ ...prev, error: 'Audio playback failed' }));
        toast({
          title: "Error",
          description: "Failed to play audio",
          variant: "destructive"
        });
      };

      audio.addEventListener('canplaythrough', handleCanPlayThrough);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      // Set audio properties
      audio.preload = 'auto';
      audio.src = audioUrl;
      audio.load();

      // Cleanup event listeners when done
      return () => {
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };

    } catch (error: any) {
      console.error('[AudioPlayer] Error:', error);
      cleanup();
      setState(prev => ({ ...prev, error: error.message }));
      toast({
        title: "Error",
        description: error.message || "Failed to play audio",
        variant: "destructive"
      });
    }
  }, [state.isLoading, state.isPlaying, cleanup, toast, options]);

  return {
    ...state,
    handlePlayback,
    cleanup
  };
};