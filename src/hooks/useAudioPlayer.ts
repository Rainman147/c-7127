import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AudioPlayerState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
}

export const useAudioPlayer = (options?: { onError?: (error: string) => void }) => {
  const [state, setState] = useState<AudioPlayerState>({
    isLoading: false,
    isPlaying: false,
    error: null
  });
  
  const { toast } = useToast();

  // Cleanup function
  useEffect(() => {
    return () => {
      console.log('[useAudioPlayer] Cleaning up resources');
    };
  }, []);

  const handlePlayback = useCallback(async (text: string) => {
    console.log('[useAudioPlayer] Starting playback request:', { textLength: text.length });

    // If already playing, stop current playback
    if (state.isPlaying) {
      console.log('[useAudioPlayer] Stopping current playback');
      setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      console.log('[useAudioPlayer] Requesting audio from TTS API');

      // Request audio data from our TTS endpoint
      const response = await supabase.functions.invoke('text-to-speech', {
        body: { text: text.slice(0, 4096) }
      });

      console.log('[useAudioPlayer] TTS API Response:', response);

      if (response.error) {
        throw new Error(`API Error: ${response.error.message}`);
      }

      if (!response.data) {
        throw new Error('No audio data received');
      }

      console.log('[useAudioPlayer] Received audio data, size:', response.data.length);

      // Convert the response data to Uint8Array and create a blob
      const uint8Array = new Uint8Array(Object.values(response.data));
      const blob = new Blob([uint8Array], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);
      
      console.log('[useAudioPlayer] Created audio URL:', audioUrl);

      // Create and configure audio element
      const audio = new Audio();
      
      audio.oncanplay = () => {
        console.log('[useAudioPlayer] Audio ready to play');
        audio.play().catch((e) => {
          console.error('[useAudioPlayer] Play error:', e);
          setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
          toast({
            title: "Playback Error",
            description: "Unable to play audio. Please try again.",
            variant: "destructive",
          });
        });
      };

      audio.onplay = () => {
        console.log('[useAudioPlayer] Audio playback started');
        setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
      };

      audio.onended = () => {
        console.log('[useAudioPlayer] Audio playback completed');
        setState(prev => ({ ...prev, isPlaying: false }));
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error('[useAudioPlayer] Audio error:', e);
        setState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Playback Error",
          description: "Unable to play audio. Please try again later.",
          variant: "destructive",
        });
      };

      // Set source and load audio
      audio.src = audioUrl;
      console.log('[useAudioPlayer] Set audio source and starting load');

    } catch (error: any) {
      console.error('[useAudioPlayer] Error in playback process:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isPlaying: false,
        error: error.message 
      }));
      
      toast({
        title: "Error",
        description: "Unable to generate audio. Please try again later.",
        variant: "destructive",
      });
      
      options?.onError?.(error.message);
    }
  }, [state.isPlaying, toast, options]);

  return {
    ...state,
    handlePlayback
  };
};