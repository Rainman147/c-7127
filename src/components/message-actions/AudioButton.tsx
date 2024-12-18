import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { AudioPlaybackButton } from "./audio/AudioPlaybackButton";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedCallback } from "use-debounce";

const MAX_TEXT_LENGTH = 4096;

export const AudioButton = ({ content }: { content: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Cleanup function for audio resources
  const cleanup = useCallback(() => {
    console.log('[AudioButton] Cleaning up audio resources');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setIsProcessing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleTextToSpeech = useDebouncedCallback(async () => {
    // If already playing, stop playback
    if (isPlaying) {
      console.log('[AudioButton] Stopping playback');
      cleanup();
      return;
    }

    // Prevent multiple concurrent requests
    if (isProcessing) {
      console.log('[AudioButton] Request already in progress');
      return;
    }

    try {
      setIsLoading(true);
      setIsProcessing(true);
      console.log('[AudioButton] Starting text-to-speech process');

      // Truncate text if necessary
      const truncatedText = content.slice(0, MAX_TEXT_LENGTH);
      if (content.length > MAX_TEXT_LENGTH) {
        console.warn('[AudioButton] Text truncated to 4096 characters');
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

      console.log('[AudioButton] Received audio data, preparing playback');

      // Create new audio element with proper initialization
      cleanup(); // Clean up any existing audio
      const audio = new Audio();
      audioRef.current = audio;

      // Convert the response data to a Blob
      const audioData = atob(response.data);
      const arrayBuffer = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        arrayBuffer[i] = audioData.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);
      
      // Set up audio element
      audio.src = audioUrl;
      
      // Set up event listeners
      audio.oncanplaythrough = () => {
        console.log('[AudioButton] Audio ready to play');
        audio.play().catch((e) => {
          console.error('[AudioButton] Play error:', e);
          cleanup();
          toast({
            title: "Playback Error",
            description: "Unable to play audio. Please try again.",
            variant: "destructive",
          });
        });
      };

      audio.onplay = () => {
        console.log('[AudioButton] Audio playback started');
        setIsPlaying(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        console.log('[AudioButton] Audio playback completed');
        cleanup();
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error('[AudioButton] Audio playback error:', e);
        cleanup();
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Playback Error",
          description: "Unable to play audio. Please try again later.",
          variant: "destructive",
        });
      };

    } catch (error: any) {
      console.error('[AudioButton] Error in text-to-speech process:', error);
      cleanup();
      toast({
        title: "Error",
        description: "Unable to generate audio. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, 300); // 300ms debounce

  return (
    <AudioPlaybackButton 
      isLoading={isLoading}
      isPlaying={isPlaying}
      onClick={handleTextToSpeech}
      disabled={isProcessing && !isPlaying}
    />
  );
};