import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useAudioPlayer = (options?: { onError?: (error: string) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  
  // Initialize speech synthesis
  const synth = window.speechSynthesis;
  let utterance: SpeechSynthesisUtterance | null = null;

  // Cleanup function to stop any ongoing speech
  const cleanup = useCallback(() => {
    if (utterance) {
      synth.cancel();
      utterance = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, [synth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handlePlayback = useCallback((text: string) => {
    console.log('[useAudioPlayer] Starting playback request:', { textLength: text.length });

    if (isPlaying) {
      console.log('[useAudioPlayer] Stopping current playback');
      cleanup();
      return;
    }

    try {
      setIsLoading(true);
      utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onstart = () => {
        console.log('[useAudioPlayer] Speech playback started');
        setIsPlaying(true);
        setIsLoading(false);
      };

      utterance.onend = () => {
        console.log('[useAudioPlayer] Speech playback completed');
        cleanup();
      };

      utterance.onerror = (event) => {
        console.error('[useAudioPlayer] Speech playback error:', event.error);
        cleanup();
        
        toast({
          title: "Playback Error",
          description: "Unable to play audio. Please try again.",
          variant: "destructive",
        });
        
        options?.onError?.(event.error);
      };

      synth.speak(utterance);

    } catch (error: any) {
      console.error('[useAudioPlayer] Error in speech synthesis:', error);
      cleanup();
      
      toast({
        title: "Error",
        description: "Unable to play audio. Please try again later.",
        variant: "destructive",
      });
      
      options?.onError?.(error.message);
    }
  }, [cleanup, isPlaying, toast, options]);

  return {
    isLoading,
    isPlaying,
    handlePlayback
  };
};