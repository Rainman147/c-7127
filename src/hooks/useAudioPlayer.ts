import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { audioEngine } from '@/utils/audio/audioEngine';

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
      audioEngine.cleanup();
    };
  }, []);

  const handlePlayback = useCallback(async (text: string) => {
    console.log('[useAudioPlayer] Handling playback request:', { textLength: text.length });

    // If already playing, stop current playback
    if (state.isPlaying) {
      console.log('[useAudioPlayer] Stopping current playback');
      audioEngine.stop();
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

      if (!response.data) {
        throw new Error('No audio data received from TTS API');
      }

      console.log('[useAudioPlayer] Received audio data from API');

      // Convert the response data to ArrayBuffer
      const uint8Array = new Uint8Array(Object.values(response.data));
      const arrayBuffer = uint8Array.buffer;

      // Load and decode the audio data
      console.log('[useAudioPlayer] Loading audio data into engine');
      const audioBuffer = await audioEngine.loadAudio(arrayBuffer);

      // Start playback
      console.log('[useAudioPlayer] Starting audio playback');
      audioEngine.play(audioBuffer);
      
      setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));

      // Set up a timeout to update state when audio finishes
      const duration = audioBuffer.duration * 1000; // Convert to milliseconds
      setTimeout(() => {
        setState(prev => ({ ...prev, isPlaying: false }));
      }, duration);

    } catch (error: any) {
      console.error('[useAudioPlayer] Playback error:', error);
      const errorMessage = error.message || 'Failed to play audio';
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isPlaying: false,
        error: errorMessage 
      }));

      options?.onError?.(errorMessage);
      
      toast({
        title: "Audio Playback Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [state.isPlaying, toast, options]);

  return {
    ...state,
    handlePlayback
  };
};